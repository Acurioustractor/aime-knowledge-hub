#!/usr/bin/env python3
"""
Simple chunking script specifically for Hoodie Economics
"""

import os
from pyairtable import Api
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv
import tiktoken

load_dotenv('../.env.local')

def chunk_text(text, chunk_size=500, overlap=50):
    """Simple text chunking function"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        if chunk_text.strip():
            chunks.append(chunk_text)
        
        # If we're at the end, break
        if i + chunk_size >= len(words):
            break
    
    return chunks

def generate_embedding(text, openai_client):
    """Generate embedding for text"""
    response = openai_client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def main():
    # Initialize clients
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')
    
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    supabase = create_client(
        os.getenv('SUPABASE_URL'), 
        os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    )
    
    # Find Hoodie Economics
    records = table.all()
    hoodie_record = next((r for r in records if 'Hoodie' in r['fields'].get('Title', '')), None)
    
    if not hoodie_record:
        print("❌ Hoodie Economics not found")
        return
    
    print(f"📄 Found: {hoodie_record['fields']['Title']}")
    
    full_text = hoodie_record['fields'].get('Full Text', '')
    if not full_text:
        print("❌ No full text available")
        return
    
    print(f"📝 Text length: {len(full_text)} characters")
    
    # Chunk the text
    chunks = chunk_text(full_text, chunk_size=400, overlap=40)
    print(f"🔪 Created {len(chunks)} chunks")
    
    # Generate embeddings and store in Supabase
    chunk_ids = []
    
    for i, current_chunk in enumerate(chunks):
        print(f"Processing chunk {i+1}/{len(chunks)}...")
        
        # Generate embedding
        embedding = generate_embedding(current_chunk, openai_client)
        
        # Store in Supabase
        chunk_id = f"{hoodie_record['id']}_chunk_{i}"
        
        result = supabase.table('document_chunks').insert({
            'chunk_id': chunk_id,
            'document_id': hoodie_record['id'],
            'document_title': hoodie_record['fields']['Title'],
            'chunk_index': i,
            'content': current_chunk,
            'embedding': embedding
        }).execute()
        
        if result.data:
            chunk_ids.append(str(result.data[0]['id']))
            print(f"  ✅ Stored chunk {i+1}")
        else:
            print(f"  ❌ Failed to store chunk {i+1}")
    
    # Update Airtable with chunk IDs
    chunk_ids_str = ','.join(chunk_ids)
    table.update(hoodie_record['id'], {
        'Chunk IDs': chunk_ids_str,
        'Status': 'Indexed'
    })
    
    print(f"🎉 Successfully processed Hoodie Economics:")
    print(f"   - {len(chunks)} chunks created")
    print(f"   - {len(chunk_ids)} chunks stored in Supabase")
    print(f"   - Airtable updated with chunk references")

if __name__ == "__main__":
    main() 