import { createServerClient } from '@/lib/supabase';
import { embed } from '@/lib/gemini';
import { DocumentChunk } from '@/lib/types';

/**
 * Retrieve relevant document chunks via pgvector similarity search.
 *
 * Embeds the query using Gemini text-embedding-004, then calls the
 * match_documents RPC function in Supabase.
 */
export async function retrieveChunks(
  query: string,
  options: {
    matchCount?: number;
    filterDocument?: string;
  } = {}
): Promise<DocumentChunk[]> {
  const { matchCount = 5, filterDocument } = options;

  // Embed the query
  const queryEmbedding = await embed(query);

  // Call the Supabase RPC function
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter_document: filterDocument ?? null,
  });

  if (error) {
    throw new Error(`RAG retrieval failed: ${error.message}`);
  }

  return (data || []) as DocumentChunk[];
}

/**
 * Retrieve chunks and format them as a single context string
 * suitable for injection into an LLM prompt.
 */
export async function retrieveContext(
  query: string,
  options: {
    matchCount?: number;
    filterDocument?: string;
  } = {}
): Promise<{ chunks: DocumentChunk[]; contextText: string }> {
  const chunks = await retrieveChunks(query, options);

  const contextText = chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.source_document}]\n${chunk.content}`
    )
    .join('\n\n---\n\n');

  return { chunks, contextText };
}
