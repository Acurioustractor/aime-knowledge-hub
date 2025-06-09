#!/usr/bin/env python3
"""
Script to check Supabase storage and fix permissions if needed.
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def check_supabase_storage():
    """Check if vectors were stored and fix permissions if needed."""
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_ANON_KEY')
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    try:
        # Check if there are any document chunks
        result = supabase.table('document_chunks').select('*').limit(5).execute()
        
        print(f"📊 Found {len(result.data)} document chunks in Supabase")
        
        if result.data:
            for chunk in result.data:
                print(f"   📄 {chunk['document_title']}: {chunk['content'][:100]}...")
        else:
            print("❌ No chunks found in Supabase - vectors were not stored due to permissions")
            print("\n🔧 To fix this, run this SQL in your Supabase dashboard:")
            print("   ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;")
            print("\n   Then re-run the indexer to process the documents again.")
            
            # Let's try to reset the document status so it can be reprocessed
            print("\n🔄 Let me check what documents need reprocessing...")
            
            from pyairtable import Api
            api = Api(os.getenv('AIRTABLE_API_KEY'))
            base_id = os.getenv('AIRTABLE_BASE_ID')
            table = api.table(base_id, 'Documents')
            
            # Find documents that have chunk IDs but no actual chunks in Supabase
            records = table.all()
            for record in records:
                fields = record['fields']
                chunk_ids = fields.get('Chunk IDs', '')
                if chunk_ids and 'AIME Business Cases' in fields.get('Title', ''):
                    print(f"   📋 Found document with chunk IDs but no stored vectors: {fields['Title']}")
                    print(f"   🔄 Clearing chunk IDs to allow reprocessing...")
                    
                    # Clear the chunk IDs so it can be reprocessed
                    table.update(record['id'], {
                        'Chunk IDs': '',
                        'Status': 'Ready for reprocessing'
                    })
                    print(f"   ✅ Reset document for reprocessing")
        
    except Exception as e:
        print(f"❌ Error checking Supabase: {e}")

if __name__ == "__main__":
    check_supabase_storage() 