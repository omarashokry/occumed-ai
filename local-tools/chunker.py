"""
Text chunking module for PDF ingestion.
Splits text into ~500-token chunks with 100-token overlap.
Detects regulation section headers and attaches them as metadata.
"""

import re
from dataclasses import dataclass

# Approximate: 1 token ≈ 4 characters for English text
CHARS_PER_TOKEN = 4
CHUNK_SIZE_TOKENS = 500
OVERLAP_TOKENS = 100
CHUNK_SIZE_CHARS = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN  # 2000
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN  # 400

# Patterns for detecting regulation headers/sections
SECTION_PATTERNS = [
    # "Regulation 6" or "Reg. 12" style
    re.compile(r"(?:Regulation|Reg\.?)\s+(\d+)", re.IGNORECASE),
    # "Section 2" style
    re.compile(r"Section\s+(\d+)", re.IGNORECASE),
    # "Schedule 1" style
    re.compile(r"Schedule\s+(\d+)", re.IGNORECASE),
    # "Part II" or "Part 3" style
    re.compile(r"Part\s+([IVXLCDM]+|\d+)", re.IGNORECASE),
    # "Chapter 5" style
    re.compile(r"Chapter\s+(\d+)", re.IGNORECASE),
    # Numbered headers like "6.1" or "12.3.1"
    re.compile(r"^(\d+(?:\.\d+)*)\s+[A-Z]", re.MULTILINE),
]


@dataclass
class Chunk:
    text: str
    page_number: int
    regulation_section: str | None
    chunk_index: int


def detect_section(text: str) -> str | None:
    """Extract the most relevant regulation/section header from text."""
    for pattern in SECTION_PATTERNS:
        match = pattern.search(text)
        if match:
            # Return the full match context for clarity
            start = max(0, match.start() - 5)
            end = min(len(text), match.end() + 30)
            # Clean up to end of word/line
            snippet = text[start:end].strip()
            # Take just the first line of the snippet
            snippet = snippet.split("\n")[0].strip()
            return snippet
    return None


def chunk_text(
    text: str,
    page_number: int,
    source_prefix: str,
    start_chunk_index: int = 0,
) -> list[Chunk]:
    """
    Split text into overlapping chunks of ~500 tokens.

    Args:
        text: The full text to chunk.
        page_number: The page number this text came from.
        source_prefix: Prefix for chunk IDs (e.g., "L140").
        start_chunk_index: Starting index for chunk numbering.

    Returns:
        List of Chunk objects.
    """
    if not text.strip():
        return []

    chunks = []
    pos = 0
    idx = start_chunk_index

    while pos < len(text):
        end = pos + CHUNK_SIZE_CHARS

        # Try to break at a sentence or paragraph boundary
        if end < len(text):
            # Look for the last sentence-ending punctuation before the limit
            search_region = text[pos:end]
            # Find last period/newline in the last 20% of the chunk
            boundary_search_start = int(len(search_region) * 0.8)
            boundary_region = search_region[boundary_search_start:]

            # Prefer paragraph breaks, then sentence breaks
            para_break = boundary_region.rfind("\n\n")
            if para_break != -1:
                end = pos + boundary_search_start + para_break + 2
            else:
                sent_break = boundary_region.rfind(". ")
                if sent_break != -1:
                    end = pos + boundary_search_start + sent_break + 2
                else:
                    newline_break = boundary_region.rfind("\n")
                    if newline_break != -1:
                        end = pos + boundary_search_start + newline_break + 1

        chunk_text_content = text[pos:end].strip()

        if chunk_text_content:
            section = detect_section(chunk_text_content)
            chunks.append(
                Chunk(
                    text=chunk_text_content,
                    page_number=page_number,
                    regulation_section=section,
                    chunk_index=idx,
                )
            )
            idx += 1

        # Advance position with overlap
        pos = end - OVERLAP_CHARS
        if pos <= (end - CHUNK_SIZE_CHARS):
            # Prevent infinite loop if overlap is larger than chunk
            pos = end

    return chunks


def chunk_pages(
    pages: list[tuple[int, str]], source_doc: str
) -> list[Chunk]:
    """
    Chunk all pages of a document.

    Args:
        pages: List of (page_number, text) tuples.
        source_doc: Document name for ID prefix (e.g., "HSE_L140").

    Returns:
        All chunks across all pages.
    """
    all_chunks = []
    chunk_idx = 0

    for page_num, page_text in pages:
        page_chunks = chunk_text(
            text=page_text,
            page_number=page_num,
            source_prefix=source_doc,
            start_chunk_index=chunk_idx,
        )
        all_chunks.extend(page_chunks)
        chunk_idx += len(page_chunks)

    return all_chunks
