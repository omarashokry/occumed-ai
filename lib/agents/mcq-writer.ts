import { generateJSON } from './base';
import { getMCQWriterPrompt } from '@/lib/prompts/mcq-writer';
import { retrieveContext } from '@/lib/rag/retriever';
import { MCQQuestion } from '@/lib/types';
import { MCQQuestionsResponseSchema } from '@/lib/validation/schemas';

const MIXED_PRACTICE_QUERIES = [
  'clinical assessment fitness to work occupational health',
  'workplace hazard exposure health surveillance regulations',
  'occupational disease diagnosis management treatment',
];

const HSE_MIX_QUERIES = [
  'COSHH health surveillance hazardous substances exposure limits',
  'noise vibration workplace control measures action levels',
  'asbestos lead ionising radiation occupational exposure standards',
  'RIDDOR reporting workplace injury disease regulations',
];

const TEXTBOOK_QUERIES = [
  'OMST curriculum clinical practice fitness assessment occupational medicine',
  'fitness to drive medical standards DVLA guidelines conditions',
  'good occupational medical practice ethics professional conduct',
  'fitness for work medical aspects sickness absence rehabilitation return to work',
  'occupational health clinical management diagnosis treatment workplace',
];

/** HSE regulation source_document values (from ingested PDFs) */
const HSE_DOCUMENTS = [
  'L5_Control_of_Hazardous_materials',
  'l108',
  'l24',
  'l74',
  'l140',
  'RIDDOR_2013',
  'Management_HS_Work_Regs_1999',
  'Control_of_Asbestos_Regs_2012',
  'Control_of_Lead_ACOP_L132',
  'Ionising_Radiations_Regs_2017',
];

/** Textbook/clinical source_document values (non-HSE) */
const TEXTBOOK_DOCUMENTS = [
  'OMST_2022_Curriculum_Aug_2022',
  'DVLA_Fitness_to_Drive_2024',
  'GOMP_2017',
  'Diploma_in_Occupational_Medicine_example_questions',
  'MFOM_Regs_Sep_2024',
  'assessing_fitness_to_drive_january_2024',
  'John_Hobson_(editor),_Julia_Smedley_(editor)_Fitness_for_Work_The_Medical_Aspects_Oxford_University_Press_(2019)',
  'Oxford_Handbook_of_Occupational_Health_3rd_Edition',
];

/**
 * Retrieve multi-query RAG context with deduplication.
 */
async function getMultiQueryContext(
  queries: string[],
  options: {
    matchCount?: number;
    includeDocuments?: string[];
    excludeDocuments?: string[];
  } = {}
): Promise<string> {
  const { matchCount = 5, includeDocuments, excludeDocuments } = options;

  const results = await Promise.all(
    queries.map((q) => retrieveContext(q, { matchCount, includeDocuments, excludeDocuments }))
  );

  // Merge and deduplicate chunks by content prefix
  const seen = new Set<string>();
  const allChunks: string[] = [];
  for (const r of results) {
    for (const line of r.contextText.split('\n---\n')) {
      const key = line.slice(0, 100);
      if (!seen.has(key)) {
        seen.add(key);
        allChunks.push(line);
      }
    }
  }

  // Cap at ~12 chunks
  return allChunks.slice(0, 12).join('\n---\n');
}

/** Max questions per single Gemini call */
const BATCH_SIZE = 10;

/**
 * Build the user message for a given topic and count.
 */
function buildUserMessage(topic: string, difficulty: string, count: number): string {
  switch (topic) {
    case 'mixed-practice':
      return `Generate ${count} MCQ questions covering diverse occupational medicine topics at ${difficulty} level. Each question should test a different topic area.`;
    case 'hse-mix':
      return `Generate ${count} MCQ questions drawn from HSE regulations and approved codes of practice at ${difficulty} level. Cover diverse HSE topics including COSHH, noise, vibration, asbestos, lead, ionising radiation, RIDDOR, and management of health and safety. Each question should reference specific regulation sections.`;
    case 'textbook-only':
      return `Generate ${count} MCQ questions from clinical textbook material at ${difficulty} level. Focus on OMST curriculum learning outcomes, fitness to drive assessments, good occupational medical practice, and exam preparation topics. Do NOT include questions about specific HSE regulations.`;
    default:
      return `Generate ${count} MCQ questions for the topic: "${topic}" at ${difficulty} level.`;
  }
}

/**
 * Generate a single batch of questions (up to BATCH_SIZE).
 */
async function generateBatch(
  systemPrompt: string,
  topic: string,
  difficulty: string,
  count: number
): Promise<MCQQuestion[]> {
  const userMessage = buildUserMessage(topic, difficulty, count);
  const result = await generateJSON<{ questions: MCQQuestion[] }>(
    systemPrompt,
    userMessage,
    MCQQuestionsResponseSchema
  );
  return result.questions;
}

/**
 * MCQ Writer Agent
 * Generates multiple-choice questions for a given topic using RAG context.
 * For counts > BATCH_SIZE, splits into parallel batches.
 */
export async function generateMCQs(
  topic: string,
  difficulty: string = 'DOccMed',
  count: number = 5
): Promise<MCQQuestion[]> {
  // Retrieve relevant regulatory context via RAG (once, shared across batches)
  let contextText: string;

  switch (topic) {
    case 'mixed-practice':
      contextText = await getMultiQueryContext(MIXED_PRACTICE_QUERIES);
      break;
    case 'hse-mix':
      contextText = await getMultiQueryContext(HSE_MIX_QUERIES, {
        includeDocuments: HSE_DOCUMENTS,
      });
      break;
    case 'textbook-only':
      contextText = await getMultiQueryContext(TEXTBOOK_QUERIES, {
        includeDocuments: TEXTBOOK_DOCUMENTS,
      });
      break;
    default:
      contextText = (await retrieveContext(topic, { matchCount: 8 })).contextText;
      break;
  }

  const systemPrompt = getMCQWriterPrompt(contextText);

  // For small counts, single call
  if (count <= BATCH_SIZE) {
    const questions = await generateBatch(systemPrompt, topic, difficulty, count);
    for (const q of questions) {
      if (!q.estimated_difficulty) q.estimated_difficulty = estimateDifficulty(q);
    }
    return questions;
  }

  // For large counts, split into parallel batches of BATCH_SIZE
  const batches: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const batchCount = Math.min(remaining, BATCH_SIZE);
    batches.push(batchCount);
    remaining -= batchCount;
  }

  const batchResults = await Promise.all(
    batches.map((batchCount) =>
      generateBatch(systemPrompt, topic, difficulty, batchCount)
    )
  );

  const allQuestions = batchResults.flat();

  // Estimate difficulty for each question
  for (const q of allQuestions) {
    if (!q.estimated_difficulty) q.estimated_difficulty = estimateDifficulty(q);
  }

  return allQuestions;
}

function estimateDifficulty(q: MCQQuestion): string {
  const stemLength = q.stem.length;
  const hasNumbers = /\d+\s*(dB|mg|ppm|μg|ml|mmol|ng)/i.test(q.stem);
  const hasComorbidity = /comorbid|co-exist|additional|also has/i.test(q.stem);

  if (stemLength > 400 && hasNumbers && hasComorbidity) return 'MFOM';
  if (stemLength > 300 || hasNumbers) return 'DOccMed-advanced';
  if (stemLength > 200) return 'DOccMed';
  return 'DOccMed-beginner';
}
