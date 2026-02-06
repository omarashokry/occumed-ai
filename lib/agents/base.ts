import { getGeminiFlash } from '@/lib/gemini';
import { ZodType } from 'zod';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Generate a JSON response from Gemini with automatic retry.
 * Uses responseMimeType: "application/json" for structured output.
 * Optionally validates with a Zod schema.
 */
export async function generateJSON<T>(
  systemPrompt: string,
  userMessage: string,
  schema?: ZodType<T>
): Promise<T> {
  const model = getGeminiFlash();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = result.response.text();
      const raw = JSON.parse(text);
      const parsed = schema ? schema.parse(raw) : (raw as T);
      return parsed;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Gemini JSON generation failed after ${MAX_RETRIES + 1} attempts: ${
            error instanceof Error ? error.message : 'unknown error'
          }`
        );
      }
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error('Unreachable');
}

/**
 * Generate a text response from Gemini with conversation history.
 * Used by Agent B (Actor) which needs multi-turn context.
 */
export async function generateChat(
  systemPrompt: string,
  history: { role: 'user' | 'model'; content: string }[],
  newMessage: string
): Promise<string> {
  const model = getGeminiFlash();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const contents = [
        ...history.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
        { role: 'user' as const, parts: [{ text: newMessage }] },
      ];

      const result = await model.generateContent({
        contents,
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500,
        },
      });

      return result.response.text();
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Gemini chat generation failed after ${MAX_RETRIES + 1} attempts: ${
            error instanceof Error ? error.message : 'unknown error'
          }`
        );
      }
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error('Unreachable');
}

/**
 * Generate a freeform text response from Gemini (single turn).
 */
export async function generateText(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const model = getGeminiFlash();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
        },
      });

      return result.response.text();
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Gemini text generation failed after ${MAX_RETRIES + 1} attempts: ${
            error instanceof Error ? error.message : 'unknown error'
          }`
        );
      }
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error('Unreachable');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
