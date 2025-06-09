#!/usr/bin/env python3
"""
Script to reset a specific document for reprocessing.
"""

import os
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

def reset_business_cases():
    """Reset the AIME Business Cases document for reprocessing."""
    
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    table = api.table(base_id, 'Documents')
    
    # Find the AIME Business Cases document
    records = table.all()
    for record in records:
        if 'AIME Business Cases' in record['fields'].get('Title', ''):
            print(f"📋 Found: {record['fields']['Title']}")
            print(f"   Current Chunk IDs: {record['fields'].get('Chunk IDs', 'None')}")
            print(f"   Current Status: {record['fields'].get('Status', 'None')}")
            
            # Clear chunk IDs and set to indexed status (without creating new status)
            table.update(record['id'], {
                'Chunk IDs': '',
                'Status': 'New'  # Use existing status
            })
            
            print(f"   ✅ Reset document for reprocessing")
            return
    
    print("❌ AIME Business Cases document not found")

if __name__ == "__main__":
    reset_business_cases() 