import { generateJSON } from './base';
import { getArchitectPrompt } from '@/lib/prompts/architect';
import { retrieveContext } from '@/lib/rag/retriever';
import { ScenarioConfig } from '@/lib/types';
import { ScenarioConfigSchema } from '@/lib/validation/schemas';

/**
 * Agent A — The Architect
 * Generates a complete OSCE scenario configuration for a given topic.
 */
export async function generateScenario(
  topic: string,
  difficulty: string = 'DOccMed',
  emotionalState?: string
): Promise<ScenarioConfig> {
  // Retrieve relevant regulatory context via RAG
  const { contextText } = await retrieveContext(topic, { matchCount: 8 });

  // Build the system prompt with RAG context
  const systemPrompt = getArchitectPrompt(contextText);

  // Build user message
  let userMessage = `Generate an OSCE scenario for the topic: "${topic}" at ${difficulty} level.`;
  if (emotionalState) {
    userMessage += ` The patient should have the following emotional state: "${emotionalState}".`;
  }

  // Generate scenario JSON
  const scenario = await generateJSON<ScenarioConfig>(systemPrompt, userMessage, ScenarioConfigSchema);

  // Ensure difficulty matches request
  scenario.difficulty = difficulty;

  return scenario;
}
