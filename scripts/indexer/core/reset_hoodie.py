#!/usr/bin/env python3
"""
Reset Hoodie Economics metadata to force complete reprocessing
"""

from pyairtable import Api
import os
from dotenv import load_dotenv

load_dotenv('../.env.local')

def reset_hoodie_economics():
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')

    # Find Hoodie Economics record
    records = table.all()
    hoodie_record = next((r for r in records if 'Hoodie' in r['fields'].get('Title', '')), None)

    if hoodie_record:
        print(f'📄 Found Hoodie Economics: {hoodie_record["id"]}')
        print(f'   Current status: {hoodie_record["fields"].get("Status")}')
        print(f'   Has Summary: {"Summary" in hoodie_record["fields"]}')
        print(f'   Has Themes: {"Themes" in hoodie_record["fields"]}')
        print(f'   Has Word Count: {"Word Count" in hoodie_record["fields"]}')
        
        # Clear enhanced metadata to force reprocessing
        table.update(hoodie_record['id'], {
            'Status': None,
            'Summary': None, 
            'Themes': None,
            'Author': None,
            'Word Count': None
        })
        print('✅ Cleared metadata - ready for complete reprocessing')
    else:
        print('❌ Hoodie Economics not found')

if __name__ == "__main__":
    reset_hoodie_economics() 