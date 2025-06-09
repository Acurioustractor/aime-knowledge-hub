#!/usr/bin/env python3
"""
Detailed analysis of document fields to find text content.
"""

import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

def analyze_documents():
    """Analyze documents in detail to find text content."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}

    response = requests.get(url, headers=headers)
    data = response.json()

    print('🔍 DETAILED DOCUMENT ANALYSIS')
    print('=' * 50)

    target_keywords = ['hoodie', 'nation', 'tour', 'economics', 'transcript']

    for record in data.get('records', []):
        title = record['fields'].get('Title', 'Untitled')
        
        # Check if this is one of our target documents
        if any(keyword in title.lower() for keyword in target_keywords):
            print(f'\n📄 Document: {title}')
            print(f'🆔 ID: {record["id"]}')
            print(f'📁 Has File: {"File" in record["fields"]}')
            
            # List all available fields
            print(f'🔍 All fields: {list(record["fields"].keys())}')
            
            # Check all possible text fields
            text_fields = ['Full Text', 'full_text', 'text', 'content', 'Full text', 'Text', 'Content']
            found_text = False
            
            for field in text_fields:
                if field in record['fields']:
                    content = record['fields'][field]
                    if content and len(str(content).strip()) > 0:
                        print(f'✅ Found text in "{field}": {len(str(content)):,} chars')
                        print(f'📝 Preview: {str(content)[:200]}...')
                        found_text = True
                        break
            
            if not found_text:
                print('❌ No text content found in any text field')
                
                # Check if there are any long string fields that might contain text
                for field_name, field_value in record['fields'].items():
                    if isinstance(field_value, str) and len(field_value) > 100:
                        print(f'🔍 Long text field "{field_name}": {len(field_value):,} chars')
                        print(f'📝 Preview: {field_value[:200]}...')

if __name__ == "__main__":
    analyze_documents() 