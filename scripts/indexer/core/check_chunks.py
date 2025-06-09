#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(url, key)

# Check chunks for our research paper
result = supabase.table('document_chunks').select('document_id').eq('document_id', 'rectbX1JHy6Ap1I7H').execute()
print(f'Found {len(result.data)} chunks for "No Shame at AIME" document (rectbX1JHy6Ap1I7H)')

# Check all document chunk counts
all_chunks = supabase.table('document_chunks').select('document_id').execute()
doc_counts = {}
for chunk in all_chunks.data:
    doc_id = chunk['document_id']
    doc_counts[doc_id] = doc_counts.get(doc_id, 0) + 1

print("\nAll document chunk counts:")
for doc_id, count in doc_counts.items():
    print(f'- {doc_id}: {count} chunks') 