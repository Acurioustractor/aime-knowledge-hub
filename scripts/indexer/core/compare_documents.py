#!/usr/bin/env python3
"""
Compare working documents with new ones to understand field differences.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def compare_documents():
    """Compare all documents to understand field differences."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}

    response = requests.get(url, headers=headers)
    data = response.json()

    print('📊 COMPARISON: Working vs New Documents')
    print('=' * 50)

    for record in data.get('records', []):
        title = record['fields'].get('Title', 'Untitled')
        fields = list(record['fields'].keys())
        has_full_text = 'Full Text' in record['fields']
        status = record['fields'].get('Status', 'None')
        
        print(f'\n📄 {title}')
        print(f'   Status: {status}')
        print(f'   Has Full Text: {has_full_text}')
        print(f'   Total Fields: {len(fields)}')
        print(f'   Fields: {fields}')
        
        if has_full_text:
            text_len = len(record['fields']['Full Text'])
            print(f'   ✅ Text Length: {text_len:,} chars')
            print(f'   📝 Preview: {record["fields"]["Full Text"][:100]}...')
        else:
            print(f'   ❌ No Full Text field')
            
        # Check if it has a file
        if 'File' in record['fields']:
            file_info = record['fields']['File']
            if isinstance(file_info, list) and len(file_info) > 0:
                file_obj = file_info[0]
                print(f'   📁 File: {file_obj.get("filename", "Unknown")} ({file_obj.get("size", 0)} bytes)')
            else:
                print(f'   📁 File: Present but no details')
        else:
            print(f'   📁 File: None')

if __name__ == "__main__":
    compare_documents() 