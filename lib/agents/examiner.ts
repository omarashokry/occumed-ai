import { generateJSON } from './base';
import { getExaminerPrompt } from '@/lib/prompts/examiner';
import { retrieveContext } from '@/lib/rag/retriever';
import { ScenarioConfig, ChatMessage, Scorecard } from '@/lib/types';
import { ScorecardSchema } from '@/lib/validation/schemas';

/**
 * Agent C — The Examiner
 * Grades an OSCE consultation based on the scenario, transcript, and regulations.
 */
export async function gradeSession(
  scenario: ScenarioConfig,
  transcript: ChatMessage[]
): Promise<Scorecard> {
  // Retrieve regulatory context for grading verification
  const { contextText } = await retrieveContext(
    `${scenario.topic} ${scenario.required_citation}`,
    { matchCount: 8 }
  );

  // Build system prompt
  const systemPrompt = getExaminerPrompt(scenario, contextText);

  // Format transcript for the examiner
  const transcriptText = transcript
    .map((msg) => `${msg.role === 'user' ? 'CANDIDATE' : 'PATIENT'}: ${msg.content}`)
    .join('\n\n');

  // Grade the consultation
  const scorecard = await generateJSON<Scorecard>(
    systemPrompt,
    `Please grade the following OSCE consultation transcript:\n\n${transcriptText}`,
    ScorecardSchema
  );

  return scorecard;
}
