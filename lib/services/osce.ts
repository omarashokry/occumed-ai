import { createServerClient } from '@/lib/supabase';
import { generateScenario } from '@/lib/agents/architect';
import { respondAsPatient } from '@/lib/agents/actor';
import { gradeSession } from '@/lib/agents/examiner';
import { ChatMessage, ScenarioConfig, Scorecard, OSCESession } from '@/lib/types';

/**
 * Start a new OSCE session.
 * 1. RAG retrieve for topic
 * 2. Agent A generates scenario
 * 3. Insert into osce_sessions
 * 4. Return sessionId + doorNote
 */
export async function startSession(
  topic: string,
  difficulty: string = 'DOccMed',
  emotionalState?: string
): Promise<{ sessionId: string; doorNote: string; scenario: ScenarioConfig }> {
  // Generate scenario via Agent A
  const scenario = await generateScenario(topic, difficulty, emotionalState);

  // Insert session into Supabase
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('osce_sessions')
    .insert({
      topic,
      difficulty,
      emotional_state: emotionalState || scenario.hidden_agenda.emotional_state,
      scenario_json: scenario,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return {
    sessionId: data.id,
    doorNote: scenario.door_note,
    scenario,
  };
}

/**
 * Send a message in an OSCE session.
 * 1. Read all osce_messages for session
 * 2. Insert user message
 * 3. Agent B responds with full history
 * 4. Insert assistant message
 * 5. Return response
 */
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<{ response: string }> {
  const supabase = createServerClient();

  // Read session to get scenario
  const { data: session, error: sessionError } = await supabase
    .from('osce_sessions')
    .select('scenario_json, emotional_state')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(`Session not found: ${sessionError?.message}`);
  }

  // Read existing messages
  const { data: messages, error: messagesError } = await supabase
    .from('osce_messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to read messages: ${messagesError.message}`);
  }

  const history: ChatMessage[] = (messages || []).map((m) => ({
    session_id: sessionId,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  // Insert user message
  const { error: insertError } = await supabase
    .from('osce_messages')
    .insert({ session_id: sessionId, role: 'user', content: message });

  if (insertError) {
    throw new Error(`Failed to insert user message: ${insertError.message}`);
  }

  // Get Agent B response
  const scenario = session.scenario_json as ScenarioConfig;
  const response = await respondAsPatient(
    scenario,
    history,
    message,
    session.emotional_state
  );

  // Insert assistant message
  const { error: assistantError } = await supabase
    .from('osce_messages')
    .insert({ session_id: sessionId, role: 'assistant', content: response });

  if (assistantError) {
    throw new Error(`Failed to insert assistant message: ${assistantError.message}`);
  }

  return { response };
}

/**
 * End and grade an OSCE session.
 * 1. Read all messages
 * 2. Read scenario
 * 3. Agent C grades
 * 4. Update session with scorecard
 * 5. Insert score_records
 * 6. Return scorecard
 */
export async function endSession(
  sessionId: string
): Promise<Scorecard> {
  const supabase = createServerClient();

  // Read session
  const { data: session, error: sessionError } = await supabase
    .from('osce_sessions')
    .select('scenario_json')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(`Session not found: ${sessionError?.message}`);
  }

  // Read all messages
  const { data: messages, error: messagesError } = await supabase
    .from('osce_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to read messages: ${messagesError.message}`);
  }

  const transcript: ChatMessage[] = (messages || []).map((m) => ({
    session_id: sessionId,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  if (transcript.length === 0) {
    throw new Error('Cannot grade an empty consultation');
  }

  const scenario = session.scenario_json as ScenarioConfig;

  // Grade via Agent C
  const scorecard = await gradeSession(scenario, transcript);

  // Update session with scorecard
  const { error: updateError } = await supabase
    .from('osce_sessions')
    .update({
      scorecard_json: scorecard,
      overall_outcome: scorecard.overall_outcome,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    throw new Error(`Failed to update session: ${updateError.message}`);
  }

  // Insert score records for radar chart
  const scoreRecords = [
    { category: 'history_taking', score: scorecard.history_taking.score },
    { category: 'clinical', score: scorecard.clinical_knowledge.score },
    { category: 'legal', score: scorecard.legal_regulatory.score },
    { category: 'communication', score: scorecard.communication.score },
  ];

  const { error: scoresError } = await supabase
    .from('score_records')
    .insert(
      scoreRecords.map((r) => ({
        session_id: sessionId,
        category: r.category,
        score: r.score,
      }))
    );

  if (scoresError) {
    throw new Error(`Failed to insert score records: ${scoresError.message}`);
  }

  return scorecard;
}

/**
 * Get session data + messages for resuming an in-progress session.
 */
export async function getSessionForResume(
  sessionId: string
): Promise<{
  sessionId: string;
  doorNote: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
} | null> {
  const supabase = createServerClient();

  const { data: session, error: sessionError } = await supabase
    .from('osce_sessions')
    .select('id, scenario_json, overall_outcome')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) return null;

  // Already completed — nothing to resume
  if (session.overall_outcome) return null;

  const scenario = session.scenario_json as ScenarioConfig;

  const { data: messages, error: messagesError } = await supabase
    .from('osce_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to read messages: ${messagesError.message}`);
  }

  return {
    sessionId: session.id,
    doorNote: scenario.door_note,
    messages: (messages || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  };
}

/**
 * Get the feedback/scorecard for a completed session.
 */
export async function getFeedback(
  sessionId: string
): Promise<{ session: OSCESession } | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('osce_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return { session: data as OSCESession };
}

/**
 * Get past OSCE sessions, most recent first.
 */
export async function getHistory(
  limit: number = 20
): Promise<OSCESession[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('osce_sessions')
    .select('id, topic, difficulty, emotional_state, overall_outcome, scorecard_json, started_at, ended_at')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch history: ${error.message}`);
  }

  return (data || []) as OSCESession[];
}
