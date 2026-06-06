import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request) {
  try {
    const { analysisResult, jobDescription } = await request.json();

    if (!analysisResult || !jobDescription) {
      return Response.json({ error: 'Missing required data.' }, { status: 400 });
    }

    const { score, companyName, scoreBreakdown, strengths, gaps, lowFit } = analysisResult;

    const prompt = `You are a senior career coach recommending specific learning resources for a job candidate.

CANDIDATE DATA:
ROLE / COMPANY: ${companyName || 'Unknown company'}
FIT SCORE: ${score}/100
LOW FIT: ${lowFit ? 'Yes — score below 60' : 'No'}

GAPS TO ADDRESS (prioritised):
${gaps?.map((g, i) => `${i + 1}. (severity: ${g.severity}) ${g.gap}`).join('\n') ?? 'None identified'}

SCORE BREAKDOWN:
- Mandatory Skills: ${scoreBreakdown?.mandatorySkills?.score ?? 'N/A'}/40 — ${scoreBreakdown?.mandatorySkills?.notes ?? ''}
- Experience Level: ${scoreBreakdown?.experienceLevel?.score ?? 'N/A'}/25 — ${scoreBreakdown?.experienceLevel?.notes ?? ''}
- Domain / Industry: ${scoreBreakdown?.domainFit?.score ?? 'N/A'}/20 — ${scoreBreakdown?.domainFit?.notes ?? ''}
- Project Relevance: ${scoreBreakdown?.projectRelevance?.score ?? 'N/A'}/15 — ${scoreBreakdown?.projectRelevance?.notes ?? ''}

JOB DESCRIPTION (summary context only):
${jobDescription.slice(0, 3000)}

---

Recommend specific learning resources for each gap. CRITICAL: Your entire response must be a single JSON object. No explanation before it. No summary after it. No markdown. Start your response with { and end with }. Nothing else.

Schema:
{
  "title": "string — e.g. 'Training Materials: Senior PM @ McAfee'",
  "summary": "string — 1-2 sentences on the learning priority given the gaps and role.",
  "gapResources": [
    {
      "gap": "string — the gap being addressed (copy from gaps list above, excluding severity prefix)",
      "severity": "high | medium | low",
      "resources": [
        {
          "title": "string — exact name of the resource",
          "type": "course | article | documentation | book | practice | video | tool",
          "platform": "string — where to find it (e.g. Coursera, YouTube, official docs, Amazon)",
          "cost": "free | paid | freemium",
          "estimatedTime": "string — e.g. '2 hours' or '3-4 days'",
          "why": "string — 1 sentence, max 20 words, explaining why this resource addresses this gap",
          "url": "string — best known URL or search path. Use format 'Search: [exact search query]' if you cannot provide a reliable direct URL."
        }
      ]
    }
  ],
  "quickWins": [
    {
      "action": "string — something the candidate can do in under 20 minutes today",
      "impact": "string — which gap it addresses"
    }
  ]
}

Rules:
- One gapResources entry per gap. Match the gap text exactly, excluding any severity prefix.
- Each gap: 2 resources maximum. Pick the two highest-signal options only.
- The goal is interview readiness, not mastery. Resources should help the candidate speak credibly about the gap in an interview — not become an expert.
- If a gap is about years of experience rather than a missing skill (e.g. "X years required, candidate has Y"), do not recommend learning resources — recommend reframing strategies only: how to position depth-of-impact over tenure in the interview.
- Prioritise free resources. If paid, it must be significantly better than free alternatives.
- Resources must be real and well-known — no invented platforms or courses.
- For tools like Braze, Adobe Experience Cloud, JIRA: recommend the official "getting started" or overview page only — not full certification courses.
- estimatedTime: be honest and conservative. Do not suggest a course that takes weeks for an interview happening soon.
- Maximum total learning time across all resources: 8 hours. If the gaps require more, prioritise high severity gaps and drop low severity resources entirely.
- url: only provide direct URLs you are highly confident are accurate and stable. For anything uncertain, use the Search format.
- quickWins: 2 items only. Each must be completable in under 20 minutes. Specific and immediate — not "explore the platform."
- Do not recommend certifications unless they are free, short, and directly address a named gap.
- Do not recommend generic PM books, frameworks, or courses unless they directly address a specific named gap with a specific chapter or section.
- why: max 20 words. One sentence only. Do not repeat the gap text.
- title: use the exact resource name, no embellishment.
- Tone: direct, practical, achievable. The user should finish reading this and feel equipped, not overwhelmed.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0]?.text ?? '';

    if (!raw.trim()) {
      console.error('Training route: empty response from API');
      return Response.json({
        error: 'No response generated. Please try again.'
      }, { status: 422 });
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Training route: no JSON object found in response — tail:', raw.slice(-300));
      return Response.json({
        error: 'Response format error. Please try again.'
      }, { status: 422 });
    }

    const clean = jsonMatch[0];

    let training;
    try {
      training = JSON.parse(clean);
    } catch (parseErr) {
      console.error('Training JSON parse failed — tail:', raw.slice(-200));
      return Response.json({
        error: 'Response was too long to process. Please try again.'
      }, { status: 422 });
    }

    return Response.json({ training });

  } catch (err) {
    console.error('Training route error:', err);

    if (err.status === 403) {
      return Response.json({
        error: 'API permission error. Check your Anthropic account settings.'
      }, { status: 403 });
    }

    if (err.status === 401) {
      return Response.json({
        error: 'API authentication failed. Check your ANTHROPIC_API_KEY.'
      }, { status: 401 });
    }

    if (err.status === 429) {
      return Response.json({
        error: 'Rate limit hit. Please wait a moment and try again.'
      }, { status: 429 });
    }

    return Response.json({
      error: 'Failed to generate Training Materials. Please try again.'
    }, { status: 500 });
  }
}