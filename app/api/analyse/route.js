import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { extractText } from 'unpdf';
import mammoth from 'mammoth';

const client = new Anthropic();

// --- helpers ---

async function extractFileText(file) {
  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileName.endsWith('.pdf')) {
    const { text: pdfText } = await extractText(new Uint8Array(buffer));
    return Array.isArray(pdfText) ? pdfText.join(' ').trim() : pdfText.trim();
  } else if (fileName.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } else if (fileName.endsWith('.txt')) {
    return buffer.toString('utf-8').trim();
  } else {
    throw new Error('Unsupported file format.');
  }
}
// --- scoring rubric ---

const RUBRIC = `
You are an expert recruiter and career coach. Score the candidate's CV against the job description using this rubric:

RUBRIC:
1. Mandatory Skills Match — max 40 points. Deduct proportionally for missing mandatory skills.
2. Experience Level Match — max 25 points. Deduct if over/under-qualified.
3. Domain / Industry Fit  — max 20 points. Full marks for same or directly adjacent industry.
4. Project Type Relevance — max 15 points. Full marks for similar project types.

TOTAL: 100 points. Threshold: below 60 = low fit.

INSTRUCTIONS:
- Be strict and honest. Do not inflate scores.
- Extract the company name from the job description. If not found, return null.
- Each "notes" field: 1 sentence, max 20 words. State the key reason for the score.
- "strengths": 2–4 items only. Each item max 25 words. Be specific — cite evidence from the CV, not generic praise.
- "gaps": genuine gaps only, max 4. Each "gap" max 35 words. Explain what is missing and why it matters for this role.
- Return ONLY valid JSON. No preamble, no markdown fences.

JSON format:
{
  "score": <number 0-100>,
  "companyName": "<string or null>",
  "scoreBreakdown": {
    "mandatorySkills": { "score": <0-40>, "notes": "<1 sentence, max 20 words>" },
    "experienceLevel": { "score": <0-25>, "notes": "<1 sentence, max 20 words>" },
    "domainFit":       { "score": <0-20>, "notes": "<1 sentence, max 20 words>" },
    "projectRelevance":{ "score": <0-15>, "notes": "<1 sentence, max 20 words>" }
  },
  "strengths": ["<specific strength, max 25 words>"],
  "gaps": [
    { "gap": "<what is missing and why it matters, max 35 words>", "severity": "high|medium|low" }
  ],
  "lowFit": <true if score < 60, else false>
}
`;

// --- route ---

export async function POST(request) {
  try {
    const formData = await request.formData();

    const jdMode = formData.get('jdMode');
    const cvFile = formData.get('cvFile');

    if (!cvFile) {
      return NextResponse.json({ error: 'CV file is required.' }, { status: 400 });
    }

    // Get JD text
    let jdText = '';
    if (jdMode === 'text') {
      jdText = formData.get('jdText') || '';
      if (!jdText.trim()) {
        return NextResponse.json({ error: 'Job description text is empty.' }, { status: 400 });
      }
    } else {
      const jdFile = formData.get('jdFile');
      if (!jdFile) {
        return NextResponse.json({ error: 'Job description file is required.' }, { status: 400 });
      }
      try {
        jdText = await extractFileText(jdFile);
      } catch (err) {
        console.error('JD extraction error:', err);
        return NextResponse.json(
          { error: 'Could not extract text from the job description file.' },
          { status: 422 }
        );
      }
    }

    // Get CV text
    let cvText = '';
    try {
      cvText = await extractFileText(cvFile);
    } catch (err) {
      console.error('CV extraction error:', err);
      return NextResponse.json(
        { error: 'Could not extract text from the CV file.', detail: err.message },
        { status: 422 }
      );
    }

    if (cvText.length < 50) {
      return NextResponse.json(
        { error: 'CV appears to be empty or unreadable. Please try a different file.' },
        { status: 422 }
      );
    }

    // Call Claude
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `${RUBRIC}\n\n---\nJOB DESCRIPTION:\n${jdText}\n\n---\nCANDIDATE CV:\n${cvText}`,
        },
      ],
    });

    const raw = message.content[0].text.trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error('Claude returned non-JSON:', raw);
      return NextResponse.json(
        { error: 'Analysis returned an unexpected format. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...result, jdText, cvText });  } catch (err) {
    console.error('Analyse route error:', err);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}