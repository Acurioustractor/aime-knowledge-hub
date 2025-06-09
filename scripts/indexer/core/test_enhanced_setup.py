#!/usr/bin/env python3
"""
Test Enhanced Setup
Verifies that all required fields exist before running the enhanced indexer
"""

import os
from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

def test_enhanced_setup():
    """Test if the enhanced indexer setup is ready"""
    print("🔍 Testing Enhanced Indexer Setup...")
    print("="*50)
    
    try:
        # Initialize Airtable API
        api = Api(os.getenv('AIRTABLE_API_KEY'))
        base_id = os.getenv('AIRTABLE_BASE_ID')
        
        # Test Documents table
        docs_table = api.table(base_id, 'Documents')
        docs = docs_table.all()
        
        if not docs:
            print("❌ No documents found in Documents table")
            return False
        
        # Check available fields
        sample_doc = docs[0]
        existing_fields = list(sample_doc['fields'].keys())
        
        print(f"📄 Found {len(docs)} document(s)")
        print(f"📋 Current fields: {', '.join(existing_fields)}")
        print()
        
        # Required fields for enhanced indexer
        required_fields = ['Author', 'Summary', 'Word Count', 'Language', 'Date', 'Themes']
        existing_enhanced_fields = [field for field in required_fields if field in existing_fields]
        missing_fields = [field for field in required_fields if field not in existing_fields]
        
        print("✅ FIELD STATUS:")
        for field in required_fields:
            status = "✅ EXISTS" if field in existing_fields else "❌ MISSING"
            print(f"   {field}: {status}")
        
        print()
        
        # Test Themes table
        themes_table = api.table(base_id, 'Themes')
        themes = themes_table.all()
        print(f"🏷️  Found {len(themes)} theme(s) in Themes table")
        
        # Summary
        if missing_fields:
            print(f"\n❌ SETUP INCOMPLETE")
            print(f"Missing fields: {', '.join(missing_fields)}")
            print("\n📝 NEXT STEPS:")
            print("1. Add the missing fields to your Documents table in Airtable")
            print("2. Follow the setup_instructions.md file")
            print("3. Run this test again")
            return False
        else:
            print(f"\n✅ SETUP COMPLETE!")
            print("All required fields are present.")
            print("\n🚀 READY TO RUN:")
            print("python theme_linker.py      # Link themes to documents")
            print("python full_enhanced_indexer.py  # Full enhancement")
            return True
            
    except Exception as e:
        print(f"❌ Error testing setup: {e}")
        return False

def main():
    """Run the setup test"""
    success = test_enhanced_setup()
    
    if success:
        print("\n🎉 Your enhanced indexer setup is ready!")
    else:
        print("\n⚠️  Please complete the setup before proceeding.")

if __name__ == "__main__":
    main() 