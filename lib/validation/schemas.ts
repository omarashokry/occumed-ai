import { z } from 'zod';

// Scenario Config schemas
const PatientProfileSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
  gender: z.string(),
  occupation: z.string(),
  presenting_complaint: z.string(),
  background: z.string(),
});

const HiddenAgendaSchema = z.object({
  undisclosed_symptoms: z.array(z.string()),
  emotional_state: z.string(),
  gatekeeper_rules: z.array(z.string()),
});

export const ScenarioConfigSchema = z.object({
  topic: z.string(),
  difficulty: z.string(),
  door_note: z.string(),
  patient_profile: PatientProfileSchema,
  hidden_agenda: HiddenAgendaSchema,
  clinical_checklist: z.array(z.string()),
  legal_checklist: z.array(z.string()),
  communication_checklist: z.array(z.string()),
  safety_critical_fail_trigger: z.string(),
  required_citation: z.string(),
});

// Scorecard schemas
const ScorecardItemSchema = z.object({
  item: z.string(),
  achieved: z.boolean(),
  comment: z.string(),
});

const ScorecardCategorySchema = z.object({
  score: z.coerce.number(),
  max: z.coerce.number(),
  items: z.array(ScorecardItemSchema),
});

const AnnotatedMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  annotation: z.string().optional(),
});

const ReasoningChainStepSchema = z.object({
  step: z.coerce.number(),
  candidate_action: z.string(),
  clinical_reasoning: z.string(),
  omst_lo: z.string(),
  quality: z.enum(['good', 'partial', 'missed']),
  comment: z.string(),
});

export const ScorecardSchema = z.object({
  history_taking: ScorecardCategorySchema,
  clinical_knowledge: ScorecardCategorySchema,
  legal_regulatory: ScorecardCategorySchema,
  communication: ScorecardCategorySchema,
  safety_critical_fail: z.boolean(),
  overall_outcome: z.enum(['PASS', 'FAIL']),
  overall_percentage: z.coerce.number(),
  feedback_summary: z.string(),
  citation: z.string(),
  annotated_transcript: z.array(AnnotatedMessageSchema),
  strengths: z.array(z.string()).optional(),
  improvement_areas: z.array(z.object({
    omst_lo: z.string(),
    feedback: z.string(),
    suggested_reading: z.string(),
  })).optional(),
  confidence: z.coerce.number().optional(),
  reasoning_chain: z.array(ReasoningChainStepSchema).optional(),
});

// MCQ schemas
const MCQOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
});

export const MCQQuestionSchema = z.object({
  topic_tag: z.string(),
  difficulty: z.string(),
  stem: z.string(),
  options: z.array(MCQOptionSchema),
  correct_answer: z.string(),
  explanation: z.string(),
  citation: z.string(),
  estimated_difficulty: z.string().optional(),
});

export const MCQQuestionsResponseSchema = z.object({
  questions: z.array(MCQQuestionSchema),
});
