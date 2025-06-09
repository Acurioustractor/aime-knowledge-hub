#!/usr/bin/env python3
"""
Check chunk IDs and date extraction for research paper.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def check_chunks_and_date():
    """Check chunk IDs and date extraction issues."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}

    response = requests.get(url, headers=headers)
    data = response.json()

    for record in data.get('records', []):
        title = record['fields'].get('Title', '')
        if 'no shame' in title.lower():
            fields = record['fields']
            print('🔍 CHUNK IDS & DATE ANALYSIS')
            print('=' * 40)
            print(f'📄 Document: {title}')
            
            # Check chunk IDs
            chunk_ids = fields.get('Chunk IDs', [])
            print(f'🧩 Chunk IDs: {len(chunk_ids) if chunk_ids else 0} chunks')
            if chunk_ids:
                print(f'   Sample IDs: {chunk_ids[:3] if len(chunk_ids) >= 3 else chunk_ids}')
            else:
                print('   ❌ No vector chunks created yet!')
                
            # Check date extraction
            print(f'📅 Extracted Date: {fields.get("Date", "None")}')
            print('   🤔 Expected: March 2024 (from content)')
            
            # Check content for date
            full_text = fields.get('Full Text', '')
            if 'March 2024' in full_text:
                print('   ✅ March 2024 found in content')
            if 'Publication Date: March 2024' in full_text:
                print('   ✅ "Publication Date: March 2024" found in content')
            
            print('\n🔧 Issues to fix:')
            if not chunk_ids:
                print('   1. Need to create vector chunks for RAG search')
            print('   2. Date extraction should find "March 2024" from content, not processing date')
            
            break

if __name__ == "__main__":
    check_chunks_and_date() 