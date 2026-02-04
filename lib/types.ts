// ============================================================
// OSCE Types
// ============================================================

export interface ScenarioConfig {
  topic: string;
  difficulty: string;
  door_note: string;
  patient_profile: {
    name: string;
    age: number;
    gender: string;
    occupation: string;
    presenting_complaint: string;
    background: string;
  };
  hidden_agenda: {
    undisclosed_symptoms: string[];
    emotional_state: string;
    gatekeeper_rules: string[];
  };
  clinical_checklist: string[];
  legal_checklist: string[];
  communication_checklist: string[];
  safety_critical_fail_trigger: string;
  required_citation: string;
}

export interface ScorecardItem {
  item: string;
  achieved: boolean;
  comment: string;
}

export interface Scorecard {
  history_taking: {
    score: number;
    max: number;
    items: ScorecardItem[];
  };
  clinical_knowledge: {
    score: number;
    max: number;
    items: ScorecardItem[];
  };
  legal_regulatory: {
    score: number;
    max: number;
    items: ScorecardItem[];
  };
  communication: {
    score: number;
    max: number;
    items: ScorecardItem[];
  };
  safety_critical_fail: boolean;
  overall_outcome: 'PASS' | 'FAIL';
  overall_percentage: number;
  feedback_summary: string;
  citation: string;
  annotated_transcript: AnnotatedMessage[];
}

export interface AnnotatedMessage {
  role: 'user' | 'assistant';
  content: string;
  annotation?: string;
}

// ============================================================
// MCQ Types
// ============================================================

export interface MCQOption {
  label: string; // A, B, C, D, E
  text: string;
}

export interface MCQQuestion {
  id?: string;
  topic_tag: string;
  difficulty: string;
  stem: string;
  options: MCQOption[];
  correct_answer: string; // A-E
  explanation: string;
  citation: string;
}

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
