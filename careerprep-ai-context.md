# CareerPrep-AI — Project Context

## What this project is
An AI-powered job seeker tool that helps users prepare for interviews. The core loop: upload a JD + CV → get a fit score and gap analysis → receive a personalised preparation plan with training resources.

## Current status
- Phase 1 complete — Next.js app scaffolded, Claude API connected and tested
- Git/GitHub setup in progress (Homebrew + Xcode CLI tools installing)
- Phase 2 not started yet

---

## Product scope (MVP)

### Core flow
1. User uploads JD (text) + CV (PDF)
2. LLM scores fit and identifies skill gaps
3. User reviews and confirms gap analysis
4. Score threshold check (below 60 = suggest don't apply, user can override)
5. Preparation plan generated with web-searched training resources
6. Outputs: project charter, interview guide, CV rewrite tailored to JD

### Out of scope for MVP
- Podcast conversion
- Job application tracker
- Status tracking

### Scoring approach (important)
Do NOT ask Claude to guess a number. Use a structured rubric with defined dimensions and weights:
- Mandatory skills match (40 pts)
- Experience level match (25 pts)
- Domain/industry fit (20 pts)
- Project type relevance (15 pts)

Threshold: below 60 = suggest not applying. This number needs validation against real JDs before hardcoding.

---

## Tech stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | App Router, no TypeScript, no src/ directory |
| Hosting | Vercel | Free tier, one-click deploy from GitHub |
| Backend | Next.js API routes | Serverless, no separate server needed |
| Database | Supabase | Free tier, add in Phase 3+ |
| AI | Claude API (claude-sonnet-4-6) | Scoring, gap analysis, plan generation |
| Web search | Claude web_search tool | For training resource links |
| PDF extraction | pdf-parse npm library | Extract text from uploaded CV |
| PDF generation | jsPDF | Export project charter |
| IDE | Cursor | Free tier, AI-assisted coding |
| Version control | GitHub | Repo name: careerprep-ai |

---

## Project setup (completed)

- Node.js installed (v20.x.x)
- Next.js app scaffolded at `/Users/sg/job-seeker-app` using `create-next-app`
- Setup choices: No TypeScript, ESLint, Tailwind yes, no src/ dir, App Router yes, no import alias customisation, AGENTS.md yes, no React Compiler
- Anthropic SDK installed: `npm install @anthropic-ai/sdk`
- `.env.local` created with `ANTHROPIC_API_KEY`
- API route created at `app/api/test-claude/route.js` — tested and working
- Model in use: `claude-sonnet-4-6` (sonnet-4-20250514 is deprecated as of June 2026)
- GitHub repo created: `careerprep-ai` (public)
- Homebrew installing (in progress) — will install Git and Xcode CLI tools

---

## Git setup (in progress)
Commands to run once Homebrew finishes:
```bash
brew install git
git --version
git config --global credential.helper osxkeychain
cd job-seeker-app
git init
git add .
git commit -m "phase 1 complete - first claude api call working"
```
Then push to: `https://github.com/[username]/careerprep-ai`

Authentication: use GitHub Personal Access Token (classic), not password. Scope: repo. Save token securely — GitHub shows it only once.

---

## Phase plan

| Phase | What gets built | Status |
|---|---|---|
| 1 | Environment setup, Next.js scaffold, first Claude API call | ✅ Done |
| Git | GitHub repo + version control | 🔄 In progress |
| 2 | CV + JD upload UI, PDF extraction, scoring prompt, gap display, threshold logic | ⬜ Next |
| 3 | Prep plan, web search for training links, PDF charter export, CV rewrite, interview guide | ⬜ Pending |
| 4 | Deploy to Vercel, README, LinkedIn post | ⬜ Pending |

---

## Key decisions and rationale

- **Claude API over OpenAI** — web search built-in, 200k context, better for long CV+JD analysis
- **No TypeScript** — reduces complexity for a non-coder building their first app
- **No Lovable/Bolt** — deliberate choice to learn the stack hands-on for AI PM credibility
- **Repo is public** — intentional, this is a portfolio project for LinkedIn
- **Separate API key per project** — for cost tracking and security isolation
- **MCP servers (Datadog, Figma, Notion) skipped** — not relevant to MVP

---

## Owner context
- Senior PM, consumer revenue background
- No prior coding experience
- Building this as a portfolio project to strengthen AI PM profile
- Currently job hunting — this tool is being built partly for personal use
- Target role being used for testing: eBay Value Added Services platform PM

---

## Next session starting point
Continue Git setup → confirm push to careerprep-ai repo → then start Phase 2: CV + JD upload UI with scoring.
