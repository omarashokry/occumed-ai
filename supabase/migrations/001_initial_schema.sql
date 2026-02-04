create extension if not exists vector;

-- RAG: ingested PDF chunks with embeddings
create table documents (
  id text primary key,                    -- "L140_p12_chunk3"
  content text not null,
  source_document text not null,          -- "HSE L140"
  page_number int,
  regulation_section text,
  embedding vector(768),                  -- Gemini text-embedding-004
  created_at timestamptz default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops);

-- Similarity search RPC
create function match_documents(
  query_embedding vector(768),
  match_count int default 5,
  filter_document text default null
) returns table (id text, content text, source_document text, similarity float)
as $$
  select id, content, source_document,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  where (filter_document is null or source_document = filter_document)
  order by embedding <=> query_embedding
  limit match_count;
$$ language sql;

-- OSCE sessions
create table osce_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  difficulty text default 'DOccMed',
  emotional_state text,
  scenario_json jsonb not null,
  scorecard_json jsonb,
  overall_outcome text,                   -- PASS / FAIL
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- OSCE conversation messages (Agent B state stored here)
create table osce_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references osce_sessions(id) on delete cascade,
  role text not null,                     -- 'user' or 'assistant'
  content text not null,
  created_at timestamptz default now()
);

create index on osce_messages(session_id, created_at);

-- MCQ generated questions
create table mcq_questions (
  id uuid primary key default gen_random_uuid(),
  topic_tag text not null,
  difficulty text default 'DOccMed',
  question_json jsonb not null,
  created_at timestamptz default now()
);

create index on mcq_questions(topic_tag);

-- MCQ user attempts
create table mcq_attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references mcq_questions(id),
  selected_option text not null,          -- A-E
  is_correct boolean not null,
  time_taken_seconds int,
  attempted_at timestamptz default now()
);

-- Aggregated score records for radar chart
create table score_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references osce_sessions(id),
  question_id uuid references mcq_questions(id),
  category text not null,                 -- law, clinical, ethics, communication
  score float not null,
  recorded_at timestamptz default now()
);
