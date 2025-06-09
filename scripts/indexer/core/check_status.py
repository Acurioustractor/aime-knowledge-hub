#!/usr/bin/env python3
"""
Quick status check for all documents in Airtable
"""

from pyairtable import Api
import os
from dotenv import load_dotenv

load_dotenv()

def check_status():
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Documents')
    records = table.all()

    print(f'📊 Total documents in Airtable: {len(records)}')
    print('\n📄 Document processing status:')
    print('=' * 120)
    
    needs_processing = []
    
    for i, record in enumerate(records, 1):
        fields = record['fields']
        title = fields.get('Title', 'Untitled')[:45]
        status = fields.get('Status', 'Not processed')
        word_count = fields.get('Word Count', 0)
        has_summary = bool(fields.get('Summary', '').strip())
        
        # Handle themes field - could be string or list
        themes_field = fields.get('Themes', '')
        if isinstance(themes_field, list):
            has_themes = len(themes_field) > 0
        else:
            has_themes = bool(str(themes_field).strip()) and str(themes_field) != 'processed'
        
        has_full_text = bool(fields.get('Full Text', '').strip())
        
        summary_icon = "✅" if has_summary else "❌"
        themes_icon = "✅" if has_themes else "❌"
        text_icon = "✅" if has_full_text else "❌"
        
        print(f'{i:2d}. {title:<45} | Status: {status:<12} | Words: {word_count:>5} | Text: {text_icon} | Summary: {summary_icon} | Themes: {themes_icon}')
        
        # Check if needs processing
        if not has_full_text or not has_summary or not has_themes or word_count == 0:
            needs_processing.append((record['id'], title))
    
    print('=' * 120)
    print(f'\n🔄 Documents needing processing: {len(needs_processing)}')
    
    if needs_processing:
        print('\n📋 Documents that need processing:')
        for record_id, title in needs_processing:
            print(f'   - {title} ({record_id})')
    else:
        print('\n🎉 All documents are fully processed!')

if __name__ == "__main__":
    check_status() 