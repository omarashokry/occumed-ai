# HazardGPT

AI-powered occupational medicine training platform with OSCE simulation and MCQ practice.

## Deployment

- **GitHub:** https://github.com/omarashokry/occumed-ai
- **Production URL:** https://hazardgpt.vercel.app
- **Hosting:** Vercel (linked to GitHub repo, auto-deploys on push)

## Stack

- **Frontend + API:** Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Database + Vector Store:** Supabase (PostgreSQL + pgvector)
- **AI:** Gemini API (gemini-2.5-flash for agents, text-embedding-004 for embeddings)
- **Local Tooling:** Python scripts for PDF ingestion

## Project Structure

```
occumed-ai/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── health/         # GET health check
│   │   ├── mcq/
│   │   │   ├── topics/     # GET available MCQ topics
│   │   │   ├── generate/   # POST generate & store MCQ questions
│   │   │   ├── questions/  # GET retrieve questions by topic or random
│   │   │   ├── [id]/submit/ # POST submit answer, check correctness
│   │   │   ├── stats/      # GET aggregate attempt statistics
│   │   │   └── attempts/   # GET recent attempts with question details
│   │   └── osce/
│   │       ├── topics/     # GET available topics
│   │       ├── start/      # POST start session -> {sessionId, doorNote}
│   │       ├── [id]/message/ # POST send message -> {response}
│   │       ├── [id]/end/   # POST end + grade -> {scorecard}
│   │       ├── [id]/feedback/ # GET scorecard
│   │       └── history/    # GET past sessions
│   ├── mcq/
│   │   └── page.tsx        # MCQ practice page (renders McqRoom)
│   ├── simulation/
│   │   └── page.tsx        # OSCE simulation page (renders SimulationRoom)
│   ├── stats/
│   │   └── page.tsx        # Statistics page (renders StatsContent)
│   ├── layout.tsx          # Root layout (server component) — imports NavBar client component
│   ├── page.tsx            # Dashboard (renders DashboardContent)
│   └── globals.css         # Tailwind directives + dark mode CSS vars
├── lib/
│   ├── supabase.ts         # Lazy-initialized Supabase clients (browser + server)
│   ├── gemini.ts           # Lazy-initialized Gemini client (flash + embedding)
│   ├── types.ts            # All TypeScript interfaces
│   ├── agents/
│   │   ├── base.ts         # Gemini wrapper: generateJSON(), generateChat(), generateText() with retry
│   │   ├── architect.ts    # Agent A: generateScenario(topic) -> ScenarioConfig (uses RAG)
│   │   ├── actor.ts        # Agent B: respondAsPatient(scenario, history, msg) -> string
│   │   ├── examiner.ts     # Agent C: gradeSession(scenario, transcript) -> Scorecard (uses RAG)
│   │   └── mcq-writer.ts   # MCQ Writer: generateMCQs(topic, difficulty?, count?) -> MCQQuestion[] (uses RAG)
│   ├── prompts/
│   │   ├── architect.ts    # Agent A system prompt with RAG context + OMST 2022 Curriculum LOs (targets LO2, LO3, LO4)
│   │   ├── actor.ts        # Agent B system prompt with patient profile + gatekeeper rules
│   │   ├── examiner.ts     # Agent C system prompt with grading rubric mapped to OMST domains (LO1-LO7)
│   │   └── mcq-writer.ts   # MCQ writer system prompt with OMST 2022 Curriculum domains + GPC mappings
│   ├── rag/
│   │   └── retriever.ts    # pgvector similarity search (embed query + match_documents RPC)
│   └── services/
│       ├── osce.ts         # OSCE orchestration: startSession, sendMessage, endSession, getFeedback, getHistory
│       └── mcq.ts          # MCQ orchestration: generateQuestions, getQuestionsByTopic, getRandomQuestions, submitAnswer, getAttemptStats, getRecentAttempts
├── components/             # React components organized by feature
│   ├── NavBar.tsx          # Client component: responsive nav with mobile hamburger menu, aria-label/aria-expanded toggle
│   ├── ui/
│   │   ├── Spinner.tsx     # Animated SVG spinner (sm/md/lg) — role="status", aria-label="Loading"
│   │   ├── Badge.tsx       # Variant badge (success/danger/neutral/info) — full dark mode
│   │   ├── Button.tsx      # Button with variants + isLoading spinner — aria-busy when loading
│   │   └── Card.tsx        # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter — full dark mode
│   ├── dashboard/
│   │   ├── StatsCards.tsx   # 3 metric cards (OSCE sessions, MCQ attempted, MCQ accuracy)
│   │   ├── PerformanceChart.tsx # Recharts RadarChart — dark mode aware colors via matchMedia, isLoading skeleton
│   │   ├── RecentSessions.tsx   # Table of recent OSCE sessions with outcome badges
│   │   ├── DashboardContent.tsx # Full dashboard assembly (client component) — passes isLoading to PerformanceChart
│   │   └── StatsContent.tsx     # Stats page content (client component)
│   ├── simulation/
│   │   ├── TopicSelector.tsx    # 8-card topic grid — styled error banner, aria-label on buttons, focus rings
│   │   ├── DoorNote.tsx         # Scenario door note with "Enter Room" button
│   │   ├── ChatRoom.tsx         # Messaging UI — aria-label on input, responsive max-w bubbles (85%/75%)
│   │   ├── ResultsSummary.tsx   # PASS/FAIL badge, progress bars, feedback summary, "View Full Report" button
│   │   └── SimulationRoom.tsx   # Master orchestrator routing between 4 phases
│   ├── feedback/
│   │   ├── ChecklistTable.tsx       # Table of ScorecardItems — full dark mode, overflow-x-auto
│   │   ├── AnnotatedTranscript.tsx  # Chat bubbles with annotations — responsive max-w (90%/80%)
│   │   └── FeedbackReport.tsx       # Full feedback report — styled error banner, outcome badge, checklists, transcript
│   └── mcq/
│       ├── McqTopicSelector.tsx # Topic grid — styled error banner, aria-label on buttons, focus rings on count toggles
│       ├── QuestionCard.tsx     # Question stem + options — fieldset/legend, role="radiogroup"/"radio", aria-checked
│       ├── QuestionFeedback.tsx # Post-submit: correct/incorrect badge, explanation, citation, next button
│       ├── McqSummary.tsx       # End-of-quiz score card (color-coded) + per-question mini-results
│       └── McqRoom.tsx          # Master orchestrator routing between 3 MCQ phases (select → quiz → summary)
├── hooks/
│   ├── useOsceTopics.ts    # Fetches GET /api/osce/topics on mount
│   ├── useDashboardData.ts # Parallel fetch of OSCE history + MCQ stats, computes radar data
│   ├── useOsceSession.ts   # 4-phase state machine: select → door-note → chat → results
│   ├── useMcqSession.ts    # 3-phase state machine: select → quiz → summary (MCQ practice flow)
│   └── useFeedbackReport.ts # Fetches GET /api/osce/{id}/feedback, returns session with scorecard
├── data/                   # PDF files for ingestion (gitignored)
├── local-tools/
│   ├── chunker.py          # 500-token chunks, 100-token overlap, section detection
│   ├── ingest.py           # Full pipeline: PDF -> extract -> chunk -> embed -> upsert
│   ├── requirements.txt    # pypdf, supabase, google-generativeai, python-dotenv
│   └── .env                # Python-side env vars (gitignored)
├── supabase/migrations/    # SQL migration files
└── .env.local              # Environment variables (gitignored)
```

## Supabase

- **Project ref:** bihexwwsdjfdlsjejdhs
- **Region:** EU West (London)
- **Org:** ClinIQ+
- **Dashboard:** https://supabase.com/dashboard/project/bihexwwsdjfdlsjejdhs

### Tables

| Table | Purpose |
|-------|---------|
| `documents` | RAG chunks with pgvector embeddings (768-dim) |
| `osce_sessions` | OSCE session state, scenario JSON, scorecard |
| `osce_messages` | Chat history for OSCE conversations |
| `mcq_questions` | Generated MCQ questions with JSON payload |
| `mcq_attempts` | User answer submissions |
| `score_records` | Per-category scores for radar chart |

### Ingested Documents

| Document | Chunks | Source |
|----------|--------|--------|
| COSHH Regulations 2002 (L5) | ~200 | `data/L5 Control of Hazardous materials.pdf` |
| Control of Noise at Work (L108) | varies | `data/l108.pdf` |
| Workplace H&S Welfare (L24) | varies | `data/l24.pdf` |
| First Aid at Work (L74) | varies | `data/l74.pdf` |
| Dangerous Substances (L140) | varies | `data/l140.pdf` |
| OMST 2022 Curriculum | 56 | `data/OMST-2022-Curriculum-Aug-2022.pdf` |
| RIDDOR 2013 | 64 | `data/RIDDOR-2013.pdf` |
| Management of H&S at Work Regs 1999 | 42 | `data/Management-HS-Work-Regs-1999.pdf` |
| Control of Asbestos Regs 2012 | 64 | `data/Control-of-Asbestos-Regs-2012.pdf` |
| Control of Lead at Work (ACOP L132) | 267 | `data/Control-of-Lead-ACOP-L132.pdf` |
| Ionising Radiations Regs 2017 | 148 | `data/Ionising-Radiations-Regs-2017.pdf` |
| DVLA Fitness to Drive Guide 2024 | 266 | `data/DVLA-Fitness-to-Drive-2024.pdf` |
| Good Occupational Medical Practice 2017 | 80 | `data/GOMP-2017.pdf` |

Total: ~1,767+ chunks in `documents` table.

### RPC Functions

- `match_documents(query_embedding, match_count, filter_document)` — pgvector similarity search

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key (server only)
GEMINI_API_KEY                # Google Gemini API key
```

## Key Patterns

- **Lazy initialization:** `lib/supabase.ts` and `lib/gemini.ts` don't create clients at module load time — they initialize on first call. This avoids build-time errors when env vars aren't available.
- **Server vs browser client:** `getSupabase()` for client components, `createServerClient()` for API routes/server components.
- **Stateless Agent B:** OSCE patient simulator reconstructs full conversation from `osce_messages` table on every request.
- **RAG retriever:** `retrieveChunks(query)` embeds the query via Gemini, then calls `match_documents` RPC. `retrieveContext(query)` returns both raw chunks and a formatted context string for prompt injection.
- **Idempotent ingestion:** Re-running `ingest.py` deletes existing chunks for a document before re-inserting, so it's safe to re-run.
- **Chunking:** ~500 tokens per chunk with ~100 token overlap, breaking at sentence/paragraph boundaries. Regulation section headers are auto-detected and stored as metadata.
- **State machine in hook, not URLs:** OSCE simulation flow lives in `useOsceSession` state (`select → door-note → chat → results`), MCQ flow in `useMcqSession` (`select → quiz → summary`). No separate routes or stale bookmark URLs.
- **Optimistic message rendering:** User message appears instantly in chat, typing indicator shown until AI responds.
- **No state management library:** React hooks + fetch() per page. Dashboard data fetched in parallel via `useDashboardData`.
- **Radar chart from history:** `getHistory()` includes `scorecard_json` so dashboard can compute radar data without a separate endpoint.
- **Immediate MCQ feedback:** After submitting each MCQ answer, correct/incorrect + explanation shown before moving to next question. Best practice for medical education.
- **Reusable FeedbackReport:** `FeedbackReport` component can be rendered inline from `ResultsSummary` (via toggle) or as a standalone view. Uses `useFeedbackReport` hook.
- **NavBar extracted as client component:** `layout.tsx` stays a server component (for `metadata` export). Navigation is in `components/NavBar.tsx` — a client component with `useState` for mobile hamburger toggle.
- **Consistent error banners:** All error displays use the same styled pattern: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400`. Applied in DashboardContent, TopicSelector, McqTopicSelector, FeedbackReport.
- **Dark mode chart colors:** PerformanceChart detects `prefers-color-scheme` via `window.matchMedia` listener and swaps Recharts color props (light: grid `#D1D5DB`, ticks `#6B7280`; dark: grid `#4B5563`, ticks `#9CA3AF`).
- **Accessibility:** Spinner has `role="status"` + `aria-label`. Button has `aria-busy` when loading. MCQ options use `fieldset`/`legend` + `role="radiogroup"`/`role="radio"` + `aria-checked`. Topic buttons have `aria-label`. Chat input has `aria-label`. Nav hamburger has `aria-label` + `aria-expanded`.
- **Responsive bubbles:** Chat message bubbles use `max-w-[85%] sm:max-w-[75%]` (ChatRoom) and `max-w-[90%] sm:max-w-[80%]` (AnnotatedTranscript) to prevent overflow on small phones.
- **OMST 2022 Curriculum integration:** All three AI agent prompts (architect, examiner, mcq-writer) reference the OMST 2022 Curriculum's 11 Learning Outcomes. Architect scenarios target LO2/LO3/LO4, examiner grading maps categories to LO domains, MCQ questions align to curriculum domains with GPC mappings.

## Commands

```bash
# Next.js
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint

# PDF Ingestion (from local-tools/)
cd local-tools
source venv/bin/activate          # Python venv inside local-tools/
python ingest.py                  # Ingest all PDFs in /data
python ingest.py --file ../data/specific.pdf  # Ingest one PDF
```

## Implementation Progress

- [x] Phase 1: Foundation — Next.js project, Supabase schema, lib files, health check, dashboard
- [x] Phase 2: RAG Pipeline — chunker.py, ingest.py, retriever.ts, venv + deps installed
- [x] Phase 3: Tri-Agent OSCE Engine — base agent, Architect/Actor/Examiner, prompts, OSCE service, 6 API routes
- [x] Phase 4: MCQ Engine — MCQ writer agent, services, API routes
- [x] Phase 5: Frontend — Dashboard, simulation room, topic selection
- [x] Phase 6: Frontend — Feedback report (ChecklistTable, AnnotatedTranscript, FeedbackReport), MCQ practice UI (McqTopicSelector, QuestionCard, QuestionFeedback, McqSummary, McqRoom), /mcq page, ResultsSummary "View Full Report" button
- [x] Phase 7: Polish — Mobile hamburger nav, styled error banners, dark mode chart colors, accessibility (ARIA roles/labels), responsive bubble widths, loading skeleton for PerformanceChart
- [x] OMST 2022 Curriculum — Ingested PDF (56 chunks), integrated Learning Outcomes into architect/examiner/mcq-writer prompts
- [x] Deployment — GitHub repo, Vercel project with env vars, production deploy at hazardgpt.vercel.app
- [x] Branding — Renamed from "OccuMed AI" to "HazardGPT" (layout title, NavBar logo, dashboard welcome)
