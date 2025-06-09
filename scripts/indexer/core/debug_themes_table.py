#!/usr/bin/env python3
"""
Debug Themes Table - AIME Knowledge Hub
"""

import os
import sys
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

def debug_themes_table():
    try:
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        base_id = os.getenv('AIRTABLE_BASE_ID')
        
        print(f"🔍 Connecting to Airtable base: {base_id}")
        
        # Try to access the themes table
        print("📊 Attempting to access 'Themes' table...")
        themes_table = api.table(base_id, 'Themes')
        
        # Get all records
        all_records = themes_table.all()
        print(f"✅ Found {len(all_records)} records in Themes table")
        
        if len(all_records) > 0:
            print("\\n🔍 Sample theme records:")
            for i, record in enumerate(all_records[:5]):
                print(f"  {i+1}. ID: {record['id']}")
                print(f"     Fields: {record['fields']}")
                print()
                
            if all_records:
                sample_fields = all_records[0]['fields'].keys()
                print(f"📋 Available field names: {list(sample_fields)}")
                
        else:
            print("⚠️ No records found in Themes table")
            
    except Exception as e:
        print(f"❌ Error accessing themes table: {e}")
        
    # Check documents table for theme field structure
    try:
        print("\\n🔍 Checking Documents table for theme field structure...")
        docs_table = api.table(base_id, 'Documents')
        docs = docs_table.all(max_records=3)
        
        for i, doc in enumerate(docs):
            title = doc['fields'].get('Title', 'Untitled')
            themes_field = doc['fields'].get('Themes', [])
            print(f"  Doc {i+1}: {title}")
            print(f"    Themes field: {themes_field}")
            print(f"    Themes type: {type(themes_field)}")
            print()
            
    except Exception as e:
        print(f"❌ Error checking documents: {e}")

if __name__ == "__main__":
    debug_themes_table() 