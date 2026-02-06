-- Workstream C: Session persistence
ALTER TABLE osce_sessions ADD COLUMN IF NOT EXISTS duration_seconds int;
ALTER TABLE osce_sessions ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;

-- Workstream F: Analytics
ALTER TABLE osce_sessions ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE osce_sessions ADD COLUMN IF NOT EXISTS custom_notes text;
ALTER TABLE mcq_attempts ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;

-- Workstream G: Drill mode + Flashcards
ALTER TABLE osce_sessions ADD COLUMN IF NOT EXISTS is_drill boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  regulation text,
  ease_factor float DEFAULT 2.5,
  interval_days int DEFAULT 1,
  next_review_at timestamptz DEFAULT now(),
  review_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flashcards_next_review_idx ON flashcards(next_review_at);
CREATE INDEX IF NOT EXISTS flashcards_topic_idx ON flashcards(topic);

-- Workstream F: Analytics views
CREATE OR REPLACE VIEW weak_topics AS
SELECT
  q.topic_tag AS topic,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) AS correct,
  ROUND(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) AS accuracy
FROM mcq_attempts a
JOIN mcq_questions q ON a.question_id = q.id
GROUP BY q.topic_tag
HAVING COUNT(*) >= 3
ORDER BY accuracy ASC;

CREATE OR REPLACE VIEW daily_performance AS
SELECT
  DATE(a.attempted_at) AS day,
  COUNT(*) AS attempts,
  SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) AS correct,
  ROUND(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) AS accuracy
FROM mcq_attempts a
WHERE a.attempted_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(a.attempted_at)
ORDER BY day;
