#!/usr/bin/env python3
"""
Quick status checker for both new documents.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def check_both_documents():
    """Check status of both new documents."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        # Find both documents
        hoodie_doc = None
        nation_doc = None
        
        for record in data.get('records', []):
            title = record['fields'].get('Title', '').lower()
            if 'hoodie' in title and 'economics' in title:
                hoodie_doc = record
            elif 'nation' in title and ('tour' in title or 'video' in title or 'transcript' in title):
                nation_doc = record
        
        print("📊 DOCUMENT STATUS SUMMARY")
        print("=" * 50)
        
        # Check Hoodie Economics
        print("\n📚 HOODIE ECONOMICS:")
        if hoodie_doc:
            has_text = 'Full Text' in hoodie_doc['fields']
            if has_text:
                text_len = len(hoodie_doc['fields']['Full Text'])
                print(f"✅ Status: READY! ({text_len:,} characters)")
            else:
                print(f"⏳ Status: Still extracting PDF text...")
        else:
            print("❌ Status: Not found")
        
        # Check NATION Tour Video Transcript
        print("\n🎬 NATION TOUR VIDEO TRANSCRIPT:")
        if nation_doc:
            has_text = 'Full Text' in nation_doc['fields']
            if has_text:
                text_len = len(nation_doc['fields']['Full Text'])
                print(f"✅ Status: READY! ({text_len:,} characters)")
            else:
                print(f"⏳ Status: Still extracting text...")
        else:
            print("❌ Status: Not found")
        
        # Summary
        ready_count = 0
        if hoodie_doc and 'Full Text' in hoodie_doc['fields']:
            ready_count += 1
        if nation_doc and 'Full Text' in nation_doc['fields']:
            ready_count += 1
        
        print(f"\n📈 SUMMARY: {ready_count}/2 documents ready for processing")
        
        if ready_count > 0:
            print("🚀 Ready to run: python full_enhanced_indexer.py")
        else:
            print("⏳ Background monitoring will auto-process when ready")
        
        return ready_count > 0
        
    except Exception as e:
        print(f"❌ Error checking documents: {e}")
        return False

if __name__ == "__main__":
    check_both_documents() 