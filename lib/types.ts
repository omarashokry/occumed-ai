import { ScenarioConfigSchema, ScorecardSchema, MCQQuestionSchema } from './validation/schemas';
import { z } from 'zod';

// ============================================================
// OSCE Types
// ============================================================

export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;

export type Scorecard = z.infer<typeof ScorecardSchema>;

export type ScorecardItem = Scorecard['history_taking']['items'][number];

export type AnnotatedMessage = Scorecard['annotated_transcript'][number];

export type MCQQuestion = z.infer<typeof MCQQuestionSchema> & { id?: string; };

export type MCQOption = MCQQuestion['options'][number];

// ============================================================
// MCQ Types
// ============================================================

export interface MCQAttempt {
  id?: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  time_taken_seconds?: number;
  attempted_at?: string;
}

// ============================================================
// Chat Types
// ============================================================

export interface ChatMessage {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// ============================================================
// Dashboard / Stats Types
// ============================================================

export interface TopicStat {
  topic: string;
  total_attempts: number;
  correct: number;
  accuracy: number;
}

export interface CategoryScore {
  category: string;
  average_score: number;
}

export interface RadarChartData {
  category: string;
  score: number;
  fullMark: number;
}

// ============================================================
// Session Types
// ============================================================

export interface OSCESession {
  id: string;
  topic: string;
  difficulty: string;
  emotional_state?: string;
  scenario_json: ScenarioConfig;
  scorecard_json?: Scorecard;
  overall_outcome?: 'PASS' | 'FAIL';
  started_at: string;
  ended_at?: string;
  is_starred?: boolean;
}

// ============================================================
// RAG Types
// ============================================================

export interface DocumentChunk {
  id: string;
  content: string;
  source_document: string;
  page_number?: number;
  regulation_section?: string;
  similarity?: number;
}
