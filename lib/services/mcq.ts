import { createServerClient } from '@/lib/supabase';
import { generateMCQs } from '@/lib/agents/mcq-writer';
import { MCQQuestion } from '@/lib/types';

/**
 * Generate MCQ questions via the writer agent and store in DB.
 */
export async function generateQuestions(
  topic: string,
  difficulty: string = 'DOccMed',
  count: number = 5
): Promise<MCQQuestion[]> {
  // Generate via agent
  const questions = await generateMCQs(topic, difficulty, count);

  // Insert each question into mcq_questions
  const supabase = createServerClient();
  const questionsWithIds: MCQQuestion[] = [];

  for (const q of questions) {
    const { data, error } = await supabase
      .from('mcq_questions')
      .insert({
        topic_tag: q.topic_tag || topic,
        difficulty: q.difficulty || difficulty,
        question_json: q,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to insert question: ${error.message}`);
    }

    questionsWithIds.push({ ...q, id: data.id });
  }

  return questionsWithIds;
}

/**
 * Get questions by topic, optionally filtered by difficulty.
 */
export async function getQuestionsByTopic(
  topic: string,
  difficulty?: string,
  limit: number = 20
): Promise<MCQQuestion[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('mcq_questions')
    .select('id, topic_tag, difficulty, question_json, created_at')
    .eq('topic_tag', topic)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    ...(row.question_json as Omit<MCQQuestion, 'id'>),
  }));
}

/**
 * Get random questions, optionally filtered by topic and difficulty.
 */
export async function getRandomQuestions(
  count: number = 10,
  topic?: string,
  difficulty?: string
): Promise<MCQQuestion[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('mcq_questions')
    .select('id, topic_tag, difficulty, question_json');

  if (topic) {
    query = query.eq('topic_tag', topic);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch random questions: ${error.message}`);
  }

  // Shuffle in JS since Supabase JS client doesn't support ORDER BY random()
  const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map((row) => ({
    id: row.id,
    ...(row.question_json as Omit<MCQQuestion, 'id'>),
  }));
}

/**
 * Submit an answer for a question. Server-side correctness check.
 */
export async function submitAnswer(
  questionId: string,
  selectedOption: string,
  timeTakenSeconds?: number
): Promise<{
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  citation: string;
}> {
  const supabase = createServerClient();

  // Fetch the question
  const { data: question, error: questionError } = await supabase
    .from('mcq_questions')
    .select('id, question_json')
    .eq('id', questionId)
    .single();

  if (questionError || !question) {
    throw new Error(`Question not found: ${questionError?.message}`);
  }

  const qJson = question.question_json as MCQQuestion;
  const isCorrect = qJson.correct_answer === selectedOption;

  // Insert attempt
  const { error: attemptError } = await supabase
    .from('mcq_attempts')
    .insert({
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds ?? null,
    });

  if (attemptError) {
    throw new Error(`Failed to record attempt: ${attemptError.message}`);
  }

  return {
    is_correct: isCorrect,
    correct_answer: qJson.correct_answer,
    explanation: qJson.explanation,
    citation: qJson.citation,
  };
}

/**
 * Get aggregate attempt statistics, optionally filtered by topic.
 */
export async function getAttemptStats(
  topic?: string
): Promise<{
  total: number;
  correct: number;
  accuracy: number;
  byTopic: { topic: string; total: number; correct: number; accuracy: number }[];
}> {
  const supabase = createServerClient();

  // Join attempts with questions to get topic info
  let query = supabase
    .from('mcq_attempts')
    .select('is_correct, mcq_questions!inner(topic_tag)');

  if (topic) {
    query = query.eq('mcq_questions.topic_tag', topic);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch attempt stats: ${error.message}`);
  }

  const rows = data || [];
  const total = rows.length;
  const correct = rows.filter((r) => r.is_correct).length;

  // Group by topic
  const topicMap = new Map<string, { total: number; correct: number }>();
  for (const row of rows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicTag = (row as any).mcq_questions.topic_tag as string;
    const entry = topicMap.get(topicTag) || { total: 0, correct: 0 };
    entry.total++;
    if (row.is_correct) entry.correct++;
    topicMap.set(topicTag, entry);
  }

  const byTopic = Array.from(topicMap.entries()).map(([t, stats]) => ({
    topic: t,
    total: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  return {
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    byTopic,
  };
}

/**
 * Get recent attempts with question details.
 */
export async function getRecentAttempts(
  limit: number = 20
): Promise<
  {
    id: string;
    question_id: string;
    selected_option: string;
    is_correct: boolean;
    time_taken_seconds: number | null;
    attempted_at: string;
    question: MCQQuestion;
  }[]
> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('mcq_attempts')
    .select('id, question_id, selected_option, is_correct, time_taken_seconds, attempted_at, mcq_questions(id, topic_tag, difficulty, question_json)')
    .order('attempted_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent attempts: ${error.message}`);
  }

  return (data || []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q = (row as any).mcq_questions;
    return {
      id: row.id,
      question_id: row.question_id,
      selected_option: row.selected_option,
      is_correct: row.is_correct,
      time_taken_seconds: row.time_taken_seconds,
      attempted_at: row.attempted_at,
      question: {
        id: q.id,
        ...(q.question_json as Omit<MCQQuestion, 'id'>),
      },
    };
  });
}
