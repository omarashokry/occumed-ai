import { generateJSON } from './base';
import { retrieveContext } from '@/lib/rag/retriever';

interface Flashcard {
  front: string;
  back: string;
  topic: string;
  regulation: string;
}

export async function generateFlashcards(
  topic: string,
  weakPoints: string[],
  count: number = 10
): Promise<Flashcard[]> {
  const { contextText } = await retrieveContext(topic, { matchCount: 5 });

  const result = await generateJSON<{ flashcards: Flashcard[] }>(
    `You are a UK occupational medicine tutor creating spaced-repetition flashcards.

REGULATORY CONTEXT:
${contextText}

Generate flashcards where:
- FRONT: A clinical scenario, regulatory question, or decision point (1-2 sentences)
- BACK: The answer with reasoning + regulation citation (2-3 sentences)
- Focus on the student's weak areas provided
- Mix recall, application, and decision-making cards

Output as JSON: { "flashcards": [{ "front": "...", "back": "...", "topic": "...", "regulation": "..." }] }`,
    `Generate ${count} flashcards for topic "${topic}". Student weak points: ${weakPoints.join(', ')}`
  );

  return result.flashcards;
}
