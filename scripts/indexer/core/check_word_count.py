#!/usr/bin/env python3
"""
Check word count discrepancy for NATION Tour document.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def check_word_count():
    """Check word count discrepancy."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}

    response = requests.get(url, headers=headers)
    data = response.json()

    for record in data.get('records', []):
        title = record['fields'].get('Title', '')
        if 'nation' in title.lower():
            full_text = record['fields'].get('Full Text', '')
            print(f'📄 Document: {title}')
            print(f'📏 Character count: {len(full_text):,}')
            
            # Manual word count
            words = full_text.split()
            manual_word_count = len(words)
            print(f'🔢 Manual word count: {manual_word_count}')
            
            # AI-reported word count
            ai_word_count = record['fields'].get('Word Count', 'Not set')
            print(f'🤖 AI word count: {ai_word_count}')
            
            # Show first few lines
            lines = full_text.split('\n')[:5]
            print(f'📝 First few lines:')
            for line in lines:
                if line.strip():
                    print(f'   {line.strip()}')
            
            # Show sample of words
            print(f'📝 First 20 words: {" ".join(words[:20])}...')
            
            break

if __name__ == "__main__":
    check_word_count() 