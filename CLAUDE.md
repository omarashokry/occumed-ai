# HazardGPT

AI-powered occupational medicine training platform with OSCE simulation, MCQ practice, flashcards, and adaptive learning.

## Deployment

- **GitHub:** https://github.com/omarashokry/occumed-ai
- **Production URL:** https://hazardgpt.vercel.app
- **Hosting:** Vercel (linked to GitHub repo, auto-deploys on push)

## Stack

- **Frontend + API:** Next.js 14 (App Router) + Tailwind CSS + Recharts + Sonner (toasts)
- **Database + Vector Store:** Supabase (PostgreSQL + pgvector)
- **AI:** Gemini API (gemini-2.5-flash for agents, gemini-embedding-001 for embeddings — 768-dim)
- **Validation:** Zod schemas for all AI JSON outputs
- **Local Tooling:** Python scripts for PDF ingestion (google-genai SDK)

## Project Structure

```
occumed-ai/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── health/         # GET health check
│   │   ├── analytics/
│   │   │   ├── trends/     # GET daily MCQ/OSCE performance trends (30 days)
│   │   │   └── weak-topics/ # GET topics below 60% accuracy
│   │   ├── difficulty/     # GET adaptive difficulty recommendation
│   │   ├── flashcards/
│   │   │   ├── route.ts    # GET due cards / POST generate new cards
│   │   │   └── [id]/review/ # POST SM-2 spaced repetition review
│   │   ├── learning-plan/  # POST AI-generated multi-week study plan
│   │   ├── study-notes/    # POST AI-generated study notes for weak topics
│   │   ├── mcq/
│   │   │   ├── topics/     # GET available MCQ topics (includes mixed-practice)
│   │   │   ├── generate/   # POST generate & store MCQ questions (rate limited)
│   │   │   ├── questions/  # GET retrieve questions by topic or random
│   │   │   ├── [id]/submit/ # POST submit answer, check correctness
│   │   │   ├── [id]/hint/  # POST AI hint without revealing answer
│   │   │   ├── [id]/explain/ # POST multi-turn tutor chat about a question
│   │   │   ├── stats/      # GET aggregate attempt statistics
│   │   │   └── attempts/   # GET recent attempts with question details
│   │   └── osce/
│   │       ├── topics/     # GET available topics
│   │       ├── start/      # POST start session (rate limited)
│   │       ├── drill/      # POST start mini-scenario drill (2-3 turns)
│   │       ├── compare/    # POST side-by-side session comparison
│   │       ├── [id]/message/ # POST send message (rate limited)
│   │       ├── [id]/end/   # POST end + grade (rate limited)
│   │       ├── [id]/feedback/ # GET scorecard
│   │       ├── [id]/star/  # POST toggle session bookmark
│   │       ├── [id]/notes/ # PUT save session notes & tags
│   │       ├── [id]/resume/ # GET resume in-progress session
│   │       └── history/    # GET past sessions
│   ├── mcq/
│   │   └── page.tsx        # MCQ practice page (renders McqRoom)
│   ├── simulation/
│   │   └── page.tsx        # OSCE simulation page (renders SimulationRoom)
│   ├── stats/
│   │   └── page.tsx        # Statistics page (renders StatsContent)
│   ├── layout.tsx          # Root layout — NavBar, OfflineBanner, Toaster
│   ├── page.tsx            # Dashboard (renders DashboardContent)
│   └── globals.css         # Tailwind directives + dark mode CSS vars
├── lib/
│   ├── supabase.ts         # Lazy-initialized Supabase clients (browser + server)
│   ├── gemini.ts           # Lazy-initialized Gemini client (flash + gemini-embedding-001)
│   ├── types.ts            # TypeScript types derived from Zod schemas via z.infer<>
│   ├── rate-limit.ts       # In-memory sliding window rate limiter (4 instances)
│   ├── validation/
│   │   └── schemas.ts      # Zod schemas: ScenarioConfig, Scorecard, MCQQuestion, etc.
│   ├── agents/
│   │   ├── base.ts         # Gemini wrapper: generateJSON(+Zod), generateChat(), generateText()
│   │   ├── architect.ts    # Agent A: generateScenario(topic) -> ScenarioConfig (RAG + Zod)
│   │   ├── actor.ts        # Agent B: respondAsPatient(scenario, history, msg) -> string
│   │   ├── examiner.ts     # Agent C: gradeSession(scenario, transcript) -> Scorecard (RAG + Zod)
│   │   ├── mcq-writer.ts   # MCQ Writer: generateMCQs(topic, difficulty?, count?) (RAG + Zod + dedup + difficulty estimation)
│   │   ├── study-notes.ts  # Study notes generator from weak topics (RAG)
│   │   ├── flashcard-generator.ts # Flashcard generator from weak topics (RAG)
│   │   └── learning-planner.ts    # Multi-week learning plan generator
│   ├── prompts/
│   │   ├── architect.ts    # Chain-of-thought planning, comorbidity rules, 3+ gatekeeper rules
│   │   ├── actor.ts        # Patient goal framing, emotional progression, frustration rules
│   │   ├── examiner.ts     # Self-verification steps, reasoning chain, strengths/improvement areas
│   │   ├── mcq-writer.ts   # Example benchmarking, complexity rules, mixed-practice diversity
│   │   └── drill.ts        # Compressed drill scenario prompt (2-3 exchanges)
│   ├── rag/
│   │   └── retriever.ts    # pgvector similarity search (embed query + match_documents RPC)
│   └── services/
│       ├── osce.ts         # OSCE orchestration (40-message token cap, duration tracking)
│       ├── mcq.ts          # MCQ orchestration (question dedup via stem prefix matching)
│       └── difficulty.ts   # Adaptive difficulty: analyzes last 20 MCQ + 3 OSCE sessions
├── components/
│   ├── NavBar.tsx          # Responsive nav with mobile hamburger menu
│   ├── ui/
│   │   ├── Spinner.tsx     # Animated SVG spinner (sm/md/lg)
│   │   ├── Badge.tsx       # Variant badge (success/danger/neutral/info)
│   │   ├── Button.tsx      # Button with variants + isLoading spinner
│   │   ├── Card.tsx        # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   │   ├── ErrorBanner.tsx # Reusable error banner with retry/dismiss
│   │   └── OfflineBanner.tsx # Yellow banner when browser goes offline
│   ├── dashboard/
│   │   ├── StatsCards.tsx   # 3 metric cards with loading skeletons
│   │   ├── PerformanceChart.tsx  # Recharts RadarChart — dark mode aware
│   │   ├── PerformanceTrends.tsx # Recharts LineChart — 30-day accuracy trend
│   │   ├── WeakTopics.tsx        # Topics below 60% with Practice/Study Notes buttons
│   │   ├── RecentSessions.tsx    # Session table with star toggle + outcome badges
│   │   ├── DashboardContent.tsx  # Full dashboard assembly
│   │   └── StatsContent.tsx      # Stats page content
│   ├── simulation/
│   │   ├── TopicSelector.tsx    # 8-card topic grid
│   │   ├── DoorNote.tsx         # Scenario door note
│   │   ├── ChatRoom.tsx         # Chat UI with timer display + Cmd/Ctrl+K shortcut
│   │   ├── ResultsSummary.tsx   # PASS/FAIL badge, progress bars, feedback summary
│   │   └── SimulationRoom.tsx   # 4-phase orchestrator with localStorage recovery
│   ├── feedback/
│   │   ├── ChecklistTable.tsx       # Scorecard items table
│   │   ├── AnnotatedTranscript.tsx  # Chat bubbles with examiner annotations
│   │   ├── ReasoningChain.tsx       # Step-by-step clinical reasoning visualization
│   │   └── FeedbackReport.tsx       # Full report: checklists, reasoning chain, transcript
│   └── mcq/
│       ├── McqTopicSelector.tsx # Topic grid with Mixed Practice card + skeleton loading
│       ├── QuestionCard.tsx     # Question stem + options + flag button + keyboard shortcuts (1-5)
│       ├── QuestionFeedback.tsx # Correct/incorrect badge + explanation + Enter to advance
│       ├── McqSummary.tsx       # Score card + Review Answers button
│       └── McqRoom.tsx          # 4-phase orchestrator: select → quiz → summary → review
├── hooks/
│   ├── useOsceTopics.ts    # Fetches GET /api/osce/topics on mount
│   ├── useDashboardData.ts # Parallel fetch of OSCE history + MCQ stats
│   ├── useOsceSession.ts   # 4-phase state machine with localStorage persistence + timer
│   ├── useMcqSession.ts    # 4-phase state machine with localStorage + flagging + review mode
│   ├── useFeedbackReport.ts # Fetches GET /api/osce/{id}/feedback
│   └── useOnline.ts        # Browser online/offline detection hook
├── data/                   # PDF files for ingestion (gitignored)
├── local-tools/
│   ├── chunker.py          # 500-token chunks, 100-token overlap, section detection
│   ├── ingest.py           # PDF → chunk → embed (gemini-embedding-001, 768-dim) → upsert
│   ├── requirements.txt    # pypdf, supabase, google-genai, python-dotenv
│   └── .env                # Python-side env vars (gitignored)
├── supabase/migrations/
│   ├── 001_initial.sql     # Initial schema
│   └── 002_upgrade_v2.sql  # V2: flashcards table, analytics views, new columns
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
| `documents` | RAG chunks with pgvector embeddings (768-dim, gemini-embedding-001) |
| `osce_sessions` | OSCE session state, scenario JSON, scorecard, duration, starred, tags, notes, is_drill |
| `osce_messages` | Chat history for OSCE conversations |
| `mcq_questions` | Generated MCQ questions with JSON payload |
| `mcq_attempts` | User answer submissions (with is_flagged) |
| `score_records` | Per-category scores for radar chart |
| `flashcards` | Spaced repetition cards (SM-2: ease_factor, interval_days, next_review_at) |

### Views

| View | Purpose |
|------|---------|
| `weak_topics` | MCQ topics with accuracy below threshold (>= 3 attempts) |
| `daily_performance` | Daily MCQ accuracy for last 30 days |

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
| DOccMed Example Questions | 4 | `data/Diploma-in-Occupational-Medicine-example-questions.pdf` |
| MFOM Regulations Sep 2024 | 51 | `data/MFOM Regs Sep 2024.pdf` |
| Assessing Fitness to Drive Jan 2024 | 266 | `data/assessing-fitness-to-drive-january-2024.pdf` |

Total: ~2,088+ chunks in `documents` table.

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

- **Zod-first types:** All AI output types (ScenarioConfig, Scorecard, MCQQuestion) are defined as Zod schemas in `lib/validation/schemas.ts`, with TypeScript types derived via `z.infer<>` in `lib/types.ts`. The `generateJSON()` base function accepts an optional Zod schema for runtime validation.
- **Lazy initialization:** `lib/supabase.ts` and `lib/gemini.ts` don't create clients at module load time — they initialize on first call. This avoids build-time errors when env vars aren't available.
- **Server vs browser client:** `getSupabase()` for client components, `createServerClient()` for API routes/server components.
- **Rate limiting:** In-memory sliding window rate limiter in `lib/rate-limit.ts` with 4 instances (osceStart: 5/min, osceMessage: 20/min, osceEnd: 5/min, mcqGenerate: 5/min). Keys derived from client IP.
- **Token management:** `sendMessage()` caps conversation history at 40 messages to prevent token overflow in long OSCE sessions.
- **Stateless Agent B:** OSCE patient simulator reconstructs full conversation from `osce_messages` table on every request.
- **Chain-of-thought prompts:** Architect, examiner, and MCQ writer prompts include explicit multi-step reasoning instructions before generating JSON output.
- **Reasoning chain:** Examiner outputs a step-by-step `reasoning_chain` array mapping candidate actions to OMST Learning Outcomes with quality ratings (good/partial/missed).
- **Mixed Practice mode:** MCQ writer uses 3 diverse RAG queries and deduplicates results (capped at 12 chunks) for cross-topic question generation.
- **Adaptive difficulty:** `lib/services/difficulty.ts` analyzes last 20 MCQ attempts + last 3 OSCE sessions to recommend difficulty level (DOccMed-beginner → MFOM).
- **Question dedup:** Before inserting generated MCQs, existing stems are fetched and compared by 100-char prefix to prevent repeats.
- **Difficulty estimation:** `estimateDifficulty()` heuristic in mcq-writer.ts assigns difficulty based on stem length, numeric values with units, and comorbidity language.
- **SM-2 spaced repetition:** Flashcard review uses the SM-2 algorithm with ease_factor adjustment based on ratings (again/hard/good/easy).
- **localStorage persistence:** Both `useOsceSession` and `useMcqSession` hooks persist state to localStorage for session recovery on page refresh.
- **RAG retriever:** `retrieveChunks(query)` embeds the query via Gemini, then calls `match_documents` RPC. `retrieveContext(query)` returns both raw chunks and a formatted context string for prompt injection.
- **Idempotent ingestion:** Re-running `ingest.py` deletes existing chunks for a document before re-inserting, so it's safe to re-run. Uses `google-genai` SDK with `gemini-embedding-001` (768-dim output).
- **State machine in hook, not URLs:** OSCE flow lives in `useOsceSession` state (`select → door-note → chat → results`), MCQ flow in `useMcqSession` (`select → quiz → summary → review`).
- **Keyboard shortcuts:** Cmd/Ctrl+K focuses chat input, 1-5 keys select MCQ options, Enter submits/advances.
- **Accessibility:** Spinner has `role="status"` + `aria-label`. Button has `aria-busy`. MCQ options use `fieldset`/`legend` + `role="radiogroup"`. Topic buttons have `aria-label`. Nav hamburger has `aria-label` + `aria-expanded`.
- **Offline detection:** `useOnline` hook listens for browser online/offline events. `OfflineBanner` renders yellow warning when offline.
- **Toast notifications:** Sonner `<Toaster />` in layout.tsx for non-blocking feedback.

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
- [x] Phase 6: Frontend — Feedback report, MCQ practice UI, /mcq page, ResultsSummary
- [x] Phase 7: Polish — Mobile nav, error banners, dark mode charts, accessibility, responsive bubbles
- [x] OMST 2022 Curriculum — Ingested PDF (56 chunks), integrated Learning Outcomes into all prompts
- [x] Deployment — GitHub repo, Vercel project with env vars, production deploy at hazardgpt.vercel.app
- [x] Branding — Renamed from "OccuMed AI" to "HazardGPT"
- [x] V2 Upgrade — Workstream A: Mixed Practice + 3 new PDFs (DOccMed examples, MFOM Regs, Fitness to Drive)
- [x] V2 Upgrade — Workstream B: Zod validation, token management (40-msg cap), rate limiting (4 routes)
- [x] V2 Upgrade — Workstream C: localStorage persistence, consultation timer, keyboard shortcuts, MCQ flagging + review, session bookmarking, ErrorBanner
- [x] V2 Upgrade — Workstream D: Chain-of-thought prompts, patient goal framing, examiner self-verification + reasoning chain
- [x] V2 Upgrade — Workstream E: Adaptive difficulty, MCQ hints, study notes, difficulty estimation, question dedup
- [x] V2 Upgrade — Workstream F: Supabase migration (flashcards, views, columns), analytics APIs, PerformanceTrends chart, WeakTopics widget
- [x] V2 Upgrade — Workstream G: Drill mode, MCQ explain dialogue, session comparison, flashcards (SM-2), clinical reasoning chain visualization
- [x] V2 Upgrade — Workstream H: Offline detection, toast notifications (sonner), skeleton screens, session notes/tags, AI learning planner
