import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

export function getGeminiFlash(): GenerativeModel {
  return getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
}

export function getEmbeddingModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
}

export async function embed(text: string): Promise<number[]> {
  const model = getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export { getGenAI };
