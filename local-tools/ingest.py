"""
PDF ingestion script for OccuMed AI.

Scans the /data directory for PDFs, extracts text page-by-page,
chunks each page, embeds via Gemini text-embedding-004,
and upserts to the Supabase documents table.

Usage:
    cd local-tools
    pip install -r requirements.txt
    python ingest.py
    python ingest.py --file ../data/specific.pdf
"""

import os
import sys
import time
import argparse
from pathlib import Path

from dotenv import load_dotenv
from pypdf import PdfReader
import google.generativeai as genai
from supabase import create_client

from chunker import chunk_pages, Chunk

# Load environment
load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

DATA_DIR = Path(__file__).parent.parent / "data"

# Rate limiting for Gemini embedding API
EMBED_BATCH_SIZE = 20  # Gemini supports batch embedding
EMBED_DELAY = 0.5  # seconds between batches


def init_clients():
    """Initialize Supabase and Gemini clients."""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    genai.configure(api_key=GEMINI_API_KEY)
    return supabase


def extract_pages(pdf_path: Path) -> list[tuple[int, str]]:
    """Extract text from each page of a PDF."""
    reader = PdfReader(str(pdf_path))
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append((i + 1, text))
    return pages


def sanitize_doc_name(filename: str) -> str:
    """Convert filename to a clean document identifier."""
    name = Path(filename).stem
    # Replace spaces and special chars with underscores
    name = name.replace(" ", "_").replace("-", "_")
    # Remove consecutive underscores
    while "__" in name:
        name = name.replace("__", "_")
    return name


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using Gemini text-embedding-004."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=texts,
    )
    return result["embedding"]


def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    """Embed all chunks in batches with rate limiting."""
    all_embeddings = []

    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[i : i + EMBED_BATCH_SIZE]
        texts = [c.text for c in batch]

        print(f"  Embedding batch {i // EMBED_BATCH_SIZE + 1} "
              f"({len(texts)} chunks)...")

        embeddings = embed_texts(texts)
        all_embeddings.extend(embeddings)

        if i + EMBED_BATCH_SIZE < len(chunks):
            time.sleep(EMBED_DELAY)

    return all_embeddings


def upsert_chunks(
    supabase,
    chunks: list[Chunk],
    embeddings: list[list[float]],
    source_doc: str,
):
    """Upsert chunks with embeddings to Supabase documents table."""
    for chunk, embedding in zip(chunks, embeddings):
        chunk_id = f"{source_doc}_p{chunk.page_number}_c{chunk.chunk_index}"

        row = {
            "id": chunk_id,
            "content": chunk.text,
            "source_document": source_doc,
            "page_number": chunk.page_number,
            "regulation_section": chunk.regulation_section,
            "embedding": embedding,
        }

        supabase.table("documents").upsert(row, on_conflict="id").execute()

    print(f"  Upserted {len(chunks)} chunks for {source_doc}")


def delete_existing_chunks(supabase, source_doc: str):
    """Delete all existing chunks for a document (for idempotent re-ingestion)."""
    result = (
        supabase.table("documents")
        .delete()
        .eq("source_document", source_doc)
        .execute()
    )
    count = len(result.data) if result.data else 0
    if count > 0:
        print(f"  Deleted {count} existing chunks for {source_doc}")


def ingest_pdf(supabase, pdf_path: Path):
    """Full pipeline: extract -> chunk -> embed -> upsert for one PDF."""
    source_doc = sanitize_doc_name(pdf_path.name)
    print(f"\nProcessing: {pdf_path.name} -> {source_doc}")

    # Extract text
    pages = extract_pages(pdf_path)
    print(f"  Extracted {len(pages)} pages with text")

    if not pages:
        print("  No text found, skipping.")
        return

    # Chunk
    chunks = chunk_pages(pages, source_doc)
    print(f"  Created {len(chunks)} chunks")

    if not chunks:
        print("  No chunks created, skipping.")
        return

    # Delete existing (idempotent)
    delete_existing_chunks(supabase, source_doc)

    # Embed
    embeddings = embed_chunks(chunks)
    print(f"  Generated {len(embeddings)} embeddings")

    # Upsert
    upsert_chunks(supabase, chunks, embeddings, source_doc)

    print(f"  Done: {source_doc} ({len(chunks)} chunks)")


def main():
    parser = argparse.ArgumentParser(description="Ingest PDFs into OccuMed AI")
    parser.add_argument(
        "--file",
        type=str,
        help="Path to a specific PDF to ingest (default: all PDFs in /data)",
    )
    args = parser.parse_args()

    supabase = init_clients()

    if args.file:
        pdf_path = Path(args.file)
        if not pdf_path.exists():
            print(f"Error: File not found: {pdf_path}")
            sys.exit(1)
        ingest_pdf(supabase, pdf_path)
    else:
        if not DATA_DIR.exists():
            print(f"Error: Data directory not found: {DATA_DIR}")
            print("Create it and add PDF files, then run again.")
            sys.exit(1)

        pdf_files = sorted(DATA_DIR.glob("*.pdf"))
        if not pdf_files:
            print(f"No PDF files found in {DATA_DIR}")
            sys.exit(1)

        print(f"Found {len(pdf_files)} PDF(s) in {DATA_DIR}")
        for pdf_path in pdf_files:
            ingest_pdf(supabase, pdf_path)

    print("\nIngestion complete.")


if __name__ == "__main__":
    main()
