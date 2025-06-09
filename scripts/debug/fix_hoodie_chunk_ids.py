#!/usr/bin/env python3
"""
Fix Hoodie Economics chunk IDs in Airtable to use proper chunk_id format
"""

from pyairtable import Api
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('../.env.local')

def main():
    # Get proper chunk IDs from Supabase
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    result = supabase.table('document_chunks').select('chunk_id').ilike('document_title', '%Hoodie%').execute()
    
    proper_chunk_ids = [chunk['chunk_id'] for chunk in result.data]
    chunk_ids_str = ','.join(proper_chunk_ids)

    print(f'🔧 Found {len(proper_chunk_ids)} proper chunk IDs for Hoodie Economics')
    print(f'📝 Sample chunk IDs: {proper_chunk_ids[:3]}')

    # Update Airtable
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')
    records = table.all()
    hoodie_record = next((r for r in records if 'Hoodie' in r['fields'].get('Title', '')), None)

    if hoodie_record:
        print(f'📄 Found Hoodie Economics record: {hoodie_record["id"]}')
        print(f'❌ Current chunk IDs (first 50 chars): {hoodie_record["fields"].get("Chunk IDs", "")[:50]}...')
        
        # Update with proper chunk IDs
        updated_record = table.update(hoodie_record['id'], {
            'Chunk IDs': chunk_ids_str
        })
        
        print(f'✅ Updated Airtable with proper chunk IDs')
        print(f'✅ New chunk IDs (first 50 chars): {chunk_ids_str[:50]}...')
        print(f'📊 Total chunk IDs: {len(proper_chunk_ids)}')
    else:
        print('❌ Hoodie Economics record not found!')

if __name__ == '__main__':
    main() 