# FirstLight Careers

See your fit clearly. Walk in ready.

An AI-powered job preparation tool that analyses your CV against a job description, scores your fit, identifies gaps, and generates a tailored preparation package to help you walk into interviews more prepared.

Built with Next.js and the Claude API. No account required — upload, analyse, prepare.

---

## What it does

**1. Fit Score**
Upload your CV and a job description (paste or file). FirstLight Careers scores your fit across four dimensions — mandatory skills, experience level, domain fit, and project relevance — and returns an honest score out of 100 with a breakdown and notes.

**2. Gap Analysis**
Identifies specific gaps between your profile and the role, each tagged by severity (High / Medium / Low). No generic feedback — gaps are grounded in the actual JD requirements.

**3. Preparation Package**

| Output | What it contains |
|---|---|
| **Project Charter** | PM-style application brief — fit assessment, risks & mitigations, likely interview scenarios, company snapshot, success metrics |
| **Training Materials** | Curated learning resources per gap — free and low-cost, with time estimates and direct links |
| **CV Rewrite** | Your CV rewritten to match JD language, with a change log of what was changed and why. Download as `.docx` |

---

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) — structured JSON output, prompt-engineered rubric scoring
- **File parsing:** `unpdf` (PDF), `mammoth` (DOCX)
- **Document generation:** `docx` (client-side DOCX export)
- **Deployment:** Vercel
- **Styling:** Inline styles with a custom dark/light token system
- **MCP server:** Self-hosted at `/api/mcp` — exposes all four tools via Model Context Protocol for use in Claude.ai and other MCP-compatible clients

---

## How it works

```
User uploads JD + CV
        ↓
/api/analyse — Claude scores fit using a rubric, returns score + gaps + strengths
        ↓
Results page — accordion UI, gap severity pills, score breakdown
        ↓
User generates outputs (independently):
  /api/charter   → Project Charter JSON → rendered in drawer
  /api/training  → Training Materials JSON → rendered in drawer
  /api/cvrewrite → Rewritten CV JSON → rendered in drawer + .docx download
```

Each API route is a standalone Claude call. No agent loop, no vector database — structured prompt engineering with JSON schema constraints.

**MCP server** — all four routes are also exposed as tools via `/api/mcp`, following the Model Context Protocol. Claude.ai and other MCP-compatible clients can call `analyse_fit`, `generate_charter`, `generate_training`, and `generate_cvrewrite` directly without the web UI.

---

## What I learned building this

I came into this project as a PM with no prior coding experience. I used Cursor as my IDE and Claude as a coding collaborator throughout.

**Product decisions that shaped the build:**
- Rubric-based scoring (not vibes-based) — configurable weights per dimension so the scoring is auditable and consistent
- 60-point threshold for "low fit" — forces honest signal rather than always showing green
- Structured JSON output for every Claude call — makes the UI deterministic and the outputs parseable
- Client-side DOCX generation — avoids server-side file handling, keeps the architecture simple
- Session-only state (no database) — right call for MVP; reduces attack surface and infrastructure cost

**Technical concepts encountered for the first time:**
- LLM-as-judge pattern for rubric-grounded evaluation
- Prompt engineering for structured output (JSON schema constraints, field-level length caps)
- Tool use vs knowledge-based generation tradeoffs (training materials currently use model knowledge — web search via tool use is a planned improvement)
- Next.js App Router, API routes, FormData handling
- Client-side file parsing (PDF + DOCX) and text extraction limitations
- CSS grid row animation for accordion transitions
- MCP (Model Context Protocol) — exposing existing API routes as AI-callable tools, JSON-RPC 2.0 protocol handling, query param auth fallback for Claude.ai connector compatibility

---

## Running locally

**Prerequisites:** Node.js 18+, an Anthropic API key

```bash
git clone https://github.com/shwetaguptagit/firstlight-careers
cd firstlight-careers
npm install
```

Create a `.env.local` file in the root:

```
ANTHROPIC_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Planned improvements

- [ ] Web search tool use for Training Materials (real-time resource verification)
- [ ] Google Docs export for Charter and Training Materials (MCP Phase 2)
- [ ] Supabase integration — persist analysis history across sessions
- [ ] Eval framework for scoring accuracy validation
- [ ] PostHog analytics — funnel tracking from upload to output generation

---

## Project context

Built as a hands-on AI PM portfolio project to demonstrate end-to-end product thinking, API integration, and shipped software — not just specs and decks.

**Author:** Shweta Gupta — Senior PM with 12 years across consumer revenue, media, e-commerce, and AI. Currently building at the intersection of product and AI.

[LinkedIn](https://www.linkedin.com/in/shweta-gupta-5619b555/) · [GitHub](https://github.com/shwetaguptagit)
