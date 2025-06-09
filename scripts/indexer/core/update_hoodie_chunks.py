#!/usr/bin/env python3
"""
Update Airtable with Hoodie Economics chunk IDs
"""

from pyairtable import Api
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('../.env.local')

def main():
    # Get chunk IDs from Supabase
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
    result = supabase.table('document_chunks').select('id').ilike('document_title', '%Hoodie%').execute()
    chunk_ids = [str(chunk['id']) for chunk in result.data]
    chunk_ids_str = ','.join(chunk_ids)

    print(f'📊 Found {len(chunk_ids)} chunks for Hoodie Economics')

    # Update Airtable
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')
    records = table.all()
    hoodie_record = next((r for r in records if 'Hoodie' in r['fields'].get('Title', '')), None)

    if hoodie_record:
        table.update(hoodie_record['id'], {
            'Chunk IDs': chunk_ids_str,
            'Status': 'Indexed'
        })
        print('✅ Updated Airtable with chunk references')
        print(f'   - Document ID: {hoodie_record["id"]}')
        print(f'   - Chunks: {len(chunk_ids)}')
    else:
        print('❌ Hoodie Economics record not found')

if __name__ == "__main__":
    main() 