export const runtime = 'nodejs';

const MCP_API_KEY = process.env.MCP_API_KEY;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const TOOLS = [
  {
    name: 'analyse_fit',
    description:
      'Score a candidate CV against a job description using a rubric. Returns fit score (0–100), score breakdown, strengths, gaps with severity, and a low-fit flag. Run this first before calling any generation tool.',
    inputSchema: {
      type: 'object',
      properties: {
        jdText: {
          type: 'string',
          description: 'Full text of the job description.',
        },
        cvText: {
          type: 'string',
          description: 'Full text of the candidate CV.',
        },
      },
      required: ['jdText', 'cvText'],
    },
  },
  {
    name: 'generate_charter',
    description:
      'Generate a PM-style Project Charter for the job application. Requires analysisResult from analyse_fit and the original job description text.',
    inputSchema: {
      type: 'object',
      properties: {
        analysisResult: {
          type: 'object',
          description: 'The full analysisResult object returned by analyse_fit.',
        },
        jobDescription: {
          type: 'string',
          description: 'Full text of the job description.',
        },
      },
      required: ['analysisResult', 'jobDescription'],
    },
  },
  {
    name: 'generate_training',
    description:
      'Generate curated training materials and learning resources for each identified gap. Requires analysisResult from analyse_fit and the original job description text.',
    inputSchema: {
      type: 'object',
      properties: {
        analysisResult: {
          type: 'object',
          description: 'The full analysisResult object returned by analyse_fit.',
        },
        jobDescription: {
          type: 'string',
          description: 'Full text of the job description.',
        },
      },
      required: ['analysisResult', 'jobDescription'],
    },
  },
  {
    name: 'generate_cvrewrite',
    description:
      'Rewrite CV sections to better address identified gaps for the target role. Requires analysisResult from analyse_fit, the original job description, and the candidate CV text.',
    inputSchema: {
      type: 'object',
      properties: {
        analysisResult: {
          type: 'object',
          description: 'The full analysisResult object returned by analyse_fit.',
        },
        jobDescription: {
          type: 'string',
          description: 'Full text of the job description.',
        },
        cvText: {
          type: 'string',
          description: 'Full text of the candidate CV.',
        },
      },
      required: ['analysisResult', 'jobDescription', 'cvText'],
    },
  },
];

async function executeTool(name, input) {
  switch (name) {
    case 'analyse_fit': {
      const { jdText, cvText } = input;
      const formData = new FormData();
      formData.append('jdMode', 'text');
      formData.append('jdText', jdText);
      const cvBlob = new Blob([cvText], { type: 'text/plain' });
      formData.append('cvFile', cvBlob, 'cv.txt');
      const res = await fetch(`${APP_BASE_URL}/api/analyse`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'analyse_fit failed');
      return data;
    }
    case 'generate_charter': {
      const { analysisResult, jobDescription } = input;
      const res = await fetch(`${APP_BASE_URL}/api/charter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'generate_charter failed');
      return data;
    }
    case 'generate_training': {
      const { analysisResult, jobDescription } = input;
      const res = await fetch(`${APP_BASE_URL}/api/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'generate_training failed');
      return data;
    }
    case 'generate_cvrewrite': {
      const { analysisResult, jobDescription, cvText } = input;
      const res = await fetch(`${APP_BASE_URL}/api/cvrewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResult, jobDescription, cvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'generate_cvrewrite failed');
      return data;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(request) {
  const apiKey = request.headers.get('x-api-key');
  if (!MCP_API_KEY || apiKey !== MCP_API_KEY) {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorised' }, id: null },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400 }
    );
  }

  const { method, params, id } = body;

  if (method === 'initialize') {
    return Response.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'careerprep-ai', version: '1.0.0' },
        capabilities: { tools: {} },
      },
    });
  }

  if (method === 'tools/list') {
    return Response.json({
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    if (!name) {
      return Response.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Missing tool name' },
      });
    }
    const toolExists = TOOLS.find((t) => t.name === name);
    if (!toolExists) {
      return Response.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Unknown tool: ${name}` },
      });
    }
    try {
      const result = await executeTool(name, args || {});
      return Response.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      });
    } catch (err) {
      console.error(`MCP tool error [${name}]:`, err);
      return Response.json({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Error: ${err.message}` }],
          isError: true,
        },
      });
    }
  }

  return Response.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

export async function GET() {
  return Response.json({ name: 'careerprep-ai-mcp', status: 'ok' });
}
