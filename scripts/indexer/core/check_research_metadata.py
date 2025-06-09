#!/usr/bin/env python3
"""
Check detailed metadata for the research paper.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def check_research_metadata():
    """Check detailed metadata for No Shame at AIME research paper."""
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
            print(f'📄 Research Paper: {title}')
            print(f'👥 Author: {fields.get("Author", "Not extracted")}')
            print(f'📅 Date: {fields.get("Date", "Not extracted")}')
            print(f'🌍 Language: {fields.get("Language", "Not detected")}')
            print(f'📏 Word Count: {fields.get("Word Count", "Not counted")}')
            print(f'📝 Summary: {fields.get("Summary", "Not generated")[:200]}...')
            
            themes = fields.get('Themes', [])
            if themes:
                print(f'🏷️ Themes ({len(themes)}):')
                for theme in themes:
                    print(f'   - {theme}')
            else:
                print('🏷️ Themes: None linked')
            break

if __name__ == "__main__":
    check_research_metadata() 