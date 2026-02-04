import { generateJSON } from './base';
import { getMCQWriterPrompt } from '@/lib/prompts/mcq-writer';
import { retrieveContext } from '@/lib/rag/retriever';
import { MCQQuestion } from '@/lib/types';

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
  const { contextText } = await retrieveContext(topic, { matchCount: 8 });

  // Build the system prompt with RAG context
  const systemPrompt = getMCQWriterPrompt(contextText);

  // Build user message
  const userMessage = `Generate ${count} MCQ questions for the topic: "${topic}" at ${difficulty} level.`;

  // Generate questions JSON
  const result = await generateJSON<{ questions: MCQQuestion[] }>(systemPrompt, userMessage);

  return result.questions;
}
