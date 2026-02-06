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

/**
 * Retrieve mixed-practice RAG context by making 3 diverse queries
 * and merging deduplicated results.
 */
async function getMixedPracticeContext(): Promise<string> {
  const results = await Promise.all(
    MIXED_PRACTICE_QUERIES.map((q) => retrieveContext(q, { matchCount: 5 }))
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

/**
 * MCQ Writer Agent
 * Generates multiple-choice questions for a given topic using RAG context.
 */
export async function generateMCQs(
  topic: string,
  difficulty: string = 'DOccMed',
  count: number = 5
): Promise<MCQQuestion[]> {
  // Retrieve relevant regulatory context via RAG
  const contextText =
    topic === 'mixed-practice'
      ? await getMixedPracticeContext()
      : (await retrieveContext(topic, { matchCount: 8 })).contextText;

  // Build the system prompt with RAG context
  const systemPrompt = getMCQWriterPrompt(contextText);

  // Build user message
  const userMessage =
    topic === 'mixed-practice'
      ? `Generate ${count} MCQ questions covering diverse occupational medicine topics at ${difficulty} level. Each question should test a different topic area.`
      : `Generate ${count} MCQ questions for the topic: "${topic}" at ${difficulty} level.`;

  // Generate questions JSON
  const result = await generateJSON<{ questions: MCQQuestion[] }>(systemPrompt, userMessage, MCQQuestionsResponseSchema);

  // Estimate difficulty for each question
  for (const q of result.questions) {
    if (!q.estimated_difficulty) {
      q.estimated_difficulty = estimateDifficulty(q);
    }
  }
  return result.questions;
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
