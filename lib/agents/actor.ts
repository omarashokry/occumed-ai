import { generateChat } from './base';
import { getActorPrompt } from '@/lib/prompts/actor';
import { ScenarioConfig, ChatMessage } from '@/lib/types';

/**
 * Agent B — The Actor
 * Simulates the patient in an OSCE consultation.
 * Stateless per request — full history is passed in each call.
 */
export async function respondAsPatient(
  scenario: ScenarioConfig,
  messageHistory: ChatMessage[],
  newMessage: string,
  emotionalState?: string
): Promise<string> {
  // Build system prompt (without grading criteria)
  const systemPrompt = getActorPrompt(scenario, emotionalState);

  // Convert message history to Gemini format
  // Gemini uses 'model' instead of 'assistant'
  const history = messageHistory.map((msg) => ({
    role: (msg.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    content: msg.content,
  }));

  // Generate patient response
  const response = await generateChat(systemPrompt, history, newMessage);

  return response;
}
