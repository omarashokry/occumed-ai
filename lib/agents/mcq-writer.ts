import { generateJSON } from './base';
import { getMCQWriterPrompt } from '@/lib/prompts/mcq-writer';
import { retrieveContext } from '@/lib/rag/retriever';
import { MCQQuestion } from '@/lib/types';
import { MCQQuestionsResponseSchema } from '@/lib/validation/schemas';

const MIXED_PRACTICE_QUERIES = [
  'clinical assessment fitness to work occupational health',
  'workplace hazard exposure health surveillance regulations',
  'occupational disease diagnosis management treatment',
  'return to work rehabilitation sickness absence workplace adjustments',
  'pre-employment screening medical assessment occupational health',
  'mental health stress workplace psychological risk assessment',
  'respiratory surveillance occupational asthma lung function spirometry',
  'blood lead levels biological monitoring hazardous substance exposure',
  'night shift work health effects fatigue risk assessment',
  'pregnant worker risk assessment workplace accommodations maternity',
  'disability discrimination reasonable adjustments Equality Act',
  'occupational cancer carcinogens exposure surveillance screening',
];

const HSE_MIX_QUERIES = [
  'COSHH health surveillance hazardous substances exposure limits',
  'noise vibration workplace control measures action levels',
  'asbestos lead ionising radiation occupational exposure standards',
  'RIDDOR reporting workplace injury disease regulations',
  'workplace exposure limits WEL biological monitoring requirements',
  'first aid at work regulations approved code of practice',
  'management of health and safety risk assessment employer duties',
  'personal protective equipment selection hierarchy of controls',
  'control of asbestos regulations licensed removal medical surveillance',
  'ionising radiation dose limits classified workers monitoring',
  'lead at work blood lead suspension levels medical surveillance',
  'noise action levels hearing protection zones audiometry',
];

const TEXTBOOK_QUERIES = [
  'OMST curriculum clinical practice fitness assessment occupational medicine',
  'fitness to drive medical standards DVLA guidelines conditions',
  'good occupational medical practice ethics professional conduct',
  'fitness for work medical aspects sickness absence rehabilitation return to work',
  'occupational health clinical management diagnosis treatment workplace',
  'ill health retirement capability assessment pension medical evidence',
  'consent confidentiality medical reports occupational health ethics',
  'travel medicine vaccination fitness to travel occupational health',
  'musculoskeletal disorders upper limb workplace ergonomic assessment',
  'dermatology occupational skin disease contact dermatitis patch testing',
  'alcohol drugs substance misuse workplace policy testing procedures',
  'disability assessment functional capacity work restrictions adjustments',
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
  const { matchCount = 8, includeDocuments, excludeDocuments } = options;

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

  // Cap at ~20 chunks for broader source diversity
  return allChunks.slice(0, 20).join('\n---\n');
}

/**
 * Get the query bank and document filter for a given topic.
 */
function getQueryBankForTopic(topic: string): {
  queries: string[];
  includeDocuments?: string[];
} {
  switch (topic) {
    case 'mixed-practice':
      return { queries: MIXED_PRACTICE_QUERIES };
    case 'hse-mix':
      return { queries: HSE_MIX_QUERIES, includeDocuments: HSE_DOCUMENTS };
    case 'textbook-only':
      return { queries: TEXTBOOK_QUERIES, includeDocuments: TEXTBOOK_DOCUMENTS };
    default:
      return { queries: [] };
  }
}

/**
 * Get per-batch RAG context by splitting queries into non-overlapping subsets.
 */
async function getPerBatchContext(
  topic: string,
  batchIndex: number,
  totalBatches: number
): Promise<string> {
  const { queries, includeDocuments } = getQueryBankForTopic(topic);

  if (queries.length === 0) {
    // Fallback for specific topics — single RAG query
    return (await retrieveContext(topic, { matchCount: 12 })).contextText;
  }

  // Split queries into non-overlapping round-robin subsets
  const subset = queries.filter((_, i) => i % totalBatches === batchIndex);
  // Ensure at least 2 queries per batch for diversity
  const finalSubset = subset.length >= 2
    ? subset
    : queries.slice(batchIndex * 2, batchIndex * 2 + 3).length > 0
      ? queries.slice(batchIndex * 2, batchIndex * 2 + 3)
      : queries.slice(0, 3);

  return getMultiQueryContext(finalSubset, { includeDocuments });
}

/** OMST 2022 curriculum domains for batch rotation */
const OMST_DOMAINS = [
  'Professional values and behaviours',
  'Communication with workers and employers',
  'Clinical practice and fitness assessment',
  'Workplace risk identification and management',
  'Health promotion and illness prevention',
  'Leadership and teamworking',
  'Worker safety',
  'Quality improvement',
  'Safeguarding',
  'Education and training',
  'Research and evidence-based practice',
];

/** Max questions per single Gemini call */
const BATCH_SIZE = 10;

/**
 * Build the user message for a given topic and count.
 */
function buildUserMessage(
  topic: string,
  difficulty: string,
  count: number,
  domainSubset?: string[],
  exclusions?: string[]
): string {
  let base: string;
  switch (topic) {
    case 'mixed-practice':
      base = `Generate ${count} MCQ questions covering diverse occupational medicine topics at ${difficulty} level. Each question should test a different topic area.`;
      break;
    case 'hse-mix':
      base = `Generate ${count} MCQ questions drawn from HSE regulations and approved codes of practice at ${difficulty} level. Cover diverse HSE topics including COSHH, noise, vibration, asbestos, lead, ionising radiation, RIDDOR, and management of health and safety. Each question should reference specific regulation sections.`;
      break;
    case 'textbook-only':
      base = `Generate ${count} MCQ questions from clinical textbook material at ${difficulty} level. Focus on OMST curriculum learning outcomes, fitness to drive assessments, good occupational medical practice, and exam preparation topics. Do NOT include questions about specific HSE regulations.`;
      break;
    default:
      base = `Generate ${count} MCQ questions for the topic: "${topic}" at ${difficulty} level.`;
      break;
  }

  if (domainSubset && domainSubset.length > 0) {
    base += `\n\nFocus on these OMST curriculum domains for this batch:\n${domainSubset.map((d, i) => `${i + 1}. ${d}`).join('\n')}\nEach question MUST map to one of these domains. Do NOT generate questions outside these domains.`;
  }

  if (exclusions && exclusions.length > 0) {
    base += `\n\nIMPORTANT — The following scenarios have ALREADY been generated. Do NOT repeat or closely resemble any of them. Generate entirely different clinical scenarios, occupations, industries, and regulatory references:\n${exclusions.map((e) => `- ${e}`).join('\n')}`;
  }

  return base;
}

/**
 * Generate a single batch of questions (up to BATCH_SIZE).
 */
async function generateBatch(
  systemPrompt: string,
  topic: string,
  difficulty: string,
  count: number,
  options?: { temperature?: number; domainSubset?: string[]; exclusions?: string[] }
): Promise<MCQQuestion[]> {
  const userMessage = buildUserMessage(topic, difficulty, count, options?.domainSubset, options?.exclusions);
  const result = await generateJSON<{ questions: MCQQuestion[] }>(
    systemPrompt,
    userMessage,
    MCQQuestionsResponseSchema,
    { temperature: options?.temperature }
  );
  return result.questions;
}

/**
 * Build a one-line exclusion summary from a question for cross-batch dedup.
 */
function summariseForExclusion(q: MCQQuestion): string {
  // Extract occupation + topic + first 60 chars of stem as a fingerprint
  const stemSnippet = q.stem.replace(/\n/g, ' ').slice(0, 80);
  return `[${q.topic_tag}] ${stemSnippet}`;
}

/**
 * Split OMST domains into round-robin subsets for batch rotation.
 */
function getDomainSubset(batchIndex: number, totalBatches: number): string[] {
  return OMST_DOMAINS.filter((_, i) => i % totalBatches === batchIndex);
}

/**
 * MCQ Writer Agent
 * Generates multiple-choice questions for a given topic using RAG context.
 * For counts > BATCH_SIZE, uses sequential batches with:
 *   - Per-batch RAG diversity (different source chunks per batch)
 *   - OMST domain rotation (different curriculum domains per batch)
 *   - Cross-batch exclusion lists (avoids repeating scenarios)
 *   - Temperature scaling (higher creativity for later batches)
 */
export async function generateMCQs(
  topic: string,
  difficulty: string = 'DOccMed',
  count: number = 5
): Promise<MCQQuestion[]> {
  // For small counts, single call with shared context
  if (count <= BATCH_SIZE) {
    const contextText = await getSingleBatchContext(topic);
    const systemPrompt = getMCQWriterPrompt(contextText);
    const questions = await generateBatch(systemPrompt, topic, difficulty, count);
    for (const q of questions) {
      if (!q.estimated_difficulty) q.estimated_difficulty = estimateDifficulty(q);
    }
    return questions;
  }

  // For large counts, sequential batches with diversity controls
  const batchCounts: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const batchCount = Math.min(remaining, BATCH_SIZE);
    batchCounts.push(batchCount);
    remaining -= batchCount;
  }

  const totalBatches = batchCounts.length;
  const allQuestions: MCQQuestion[] = [];
  const exclusions: string[] = [];

  for (let i = 0; i < totalBatches; i++) {
    // Per-batch RAG: each batch gets different source chunks
    const contextText = await getPerBatchContext(topic, i, totalBatches);
    const systemPrompt = getMCQWriterPrompt(contextText);

    // Domain rotation: each batch covers different OMST domains
    const domainSubset = getDomainSubset(i, totalBatches);

    // Temperature scaling: first batch at 0.7, subsequent at 0.85
    const temperature = i === 0 ? 0.7 : 0.85;

    const batchQuestions = await generateBatch(
      systemPrompt,
      topic,
      difficulty,
      batchCounts[i],
      { temperature, domainSubset, exclusions: exclusions.length > 0 ? exclusions : undefined }
    );

    // Add to results and build exclusion list for next batch
    for (const q of batchQuestions) {
      if (!q.estimated_difficulty) q.estimated_difficulty = estimateDifficulty(q);
      allQuestions.push(q);
      exclusions.push(summariseForExclusion(q));
    }
  }

  return allQuestions;
}

/**
 * Get RAG context for single-batch generation (count <= BATCH_SIZE).
 */
async function getSingleBatchContext(topic: string): Promise<string> {
  switch (topic) {
    case 'mixed-practice':
      return getMultiQueryContext(MIXED_PRACTICE_QUERIES);
    case 'hse-mix':
      return getMultiQueryContext(HSE_MIX_QUERIES, { includeDocuments: HSE_DOCUMENTS });
    case 'textbook-only':
      return getMultiQueryContext(TEXTBOOK_QUERIES, { includeDocuments: TEXTBOOK_DOCUMENTS });
    default:
      return (await retrieveContext(topic, { matchCount: 12 })).contextText;
  }
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
