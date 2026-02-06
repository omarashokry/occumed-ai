import { createServerClient } from '@/lib/supabase';
import { embed } from '@/lib/gemini';
import { DocumentChunk } from '@/lib/types';

/**
 * Retrieve relevant document chunks via pgvector similarity search.
 *
 * Embeds the query using Gemini gemini-embedding-001, then calls the
 * match_documents RPC function in Supabase.
 */
export async function retrieveChunks(
  query: string,
  options: {
    matchCount?: number;
    filterDocument?: string;
    /** Restrict results to chunks from these source_document values */
    includeDocuments?: string[];
    /** Exclude chunks from these source_document values */
    excludeDocuments?: string[];
  } = {}
): Promise<DocumentChunk[]> {
  const { matchCount = 8, filterDocument, includeDocuments, excludeDocuments } = options;

  // Embed the query
  const queryEmbedding = await embed(query);

  const supabase = createServerClient();

  // If multi-document filtering is needed, over-fetch and post-filter
  if (includeDocuments || excludeDocuments) {
    const overFetch = matchCount * 3;
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: overFetch,
      filter_document: null,
    });

    if (error) {
      throw new Error(`RAG retrieval failed: ${error.message}`);
    }

    let chunks = (data || []) as DocumentChunk[];

    if (includeDocuments) {
      const includeSet = new Set(includeDocuments);
      chunks = chunks.filter((c) => includeSet.has(c.source_document));
    }
    if (excludeDocuments) {
      const excludeSet = new Set(excludeDocuments);
      chunks = chunks.filter((c) => !excludeSet.has(c.source_document));
    }

    return chunks.slice(0, matchCount);
  }

  // Standard single-document or unfiltered query
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
    includeDocuments?: string[];
    excludeDocuments?: string[];
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
