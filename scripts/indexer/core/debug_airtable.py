#!/usr/bin/env python3
"""
Debug script to check Airtable connection and data.
"""

import os
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

def debug_airtable():
    """Debug Airtable connection and data."""
    
    # Initialize Airtable
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    table = api.table(base_id, 'Documents')
    
    print("🔍 Debugging Airtable connection...")
    print(f"Base ID: {base_id}")
    
    try:
        # Fetch all records first
        print("\n📋 Fetching all documents...")
        all_records = table.all()
        print(f"Total records: {len(all_records)}")
        
        for record in all_records:
            fields = record['fields']
            print(f"\n📄 Document: {fields.get('Title', 'No Title')}")
            print(f"   ID: {record['id']}")
            print(f"   Full Text: {'✅' if fields.get('Full Text') else '❌'}")
            print(f"   Chunk IDs: {fields.get('Chunk IDs', 'None')}")
            print(f"   Status: {fields.get('Status', 'None')}")
            
        # Try simple query
        print("\n🔍 Testing simple query...")
        simple_records = table.all(formula="{Full Text} != ''")
        print(f"Records with Full Text: {len(simple_records)}")
        
        # Try query for unprocessed
        print("\n🔍 Testing unprocessed query...")
        try:
            unprocessed = table.all(formula="AND({Full Text} != '', {Chunk IDs} = '')")
            print(f"Unprocessed records: {len(unprocessed)}")
        except Exception as e:
            print(f"Error with unprocessed query: {e}")
            
            # Try alternative query
            print("Trying alternative query...")
            unprocessed = table.all(formula="{Chunk IDs} = ''")
            print(f"Records without Chunk IDs: {len(unprocessed)}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_airtable() 