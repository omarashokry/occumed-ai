import { generateText } from './base';
import { retrieveContext } from '@/lib/rag/retriever';

export async function generateStudyNotes(
  topic: string,
  weakPoints: string[]
): Promise<string> {
  const { contextText } = await retrieveContext(topic, { matchCount: 6 });

  const systemPrompt = `You are a UK occupational medicine tutor. Generate focused, educational study notes (400-600 words) for a trainee who is weak in the given topic.

REGULATORY CONTEXT:
${contextText}

Structure your notes as:
1. **Core Concept** — what this topic is about in 2-3 sentences
2. **Key Regulations** — cite specific regulation numbers with plain-English explanations
3. **Common Mistakes** — address the specific weak points provided
4. **Clinical Decision Framework** — step-by-step approach for exam scenarios
5. **Quick Reference** — bullet-point checklist of must-know facts

Use UK-specific terminology and regulations. Be concise and exam-focused.`;

  return generateText(
    systemPrompt,
    `Topic: ${topic}\nWeak points the student has demonstrated:\n${weakPoints.map((p) => `- ${p}`).join('\n')}\n\nGenerate study notes.`
  );
}
