#!/usr/bin/env python3
"""
Quick status checker for Hoodie Economics PDF extraction.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def check_hoodie_status():
    """Quick check of Hoodie Economics status."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        hoodie_doc = next((r for r in data.get('records', []) 
                          if 'hoodie' in r['fields'].get('Title', '').lower()), None)
        
        if not hoodie_doc:
            print("❌ Hoodie Economics document not found")
            return False
        
        title = hoodie_doc['fields'].get('Title', 'Unknown')
        has_file = 'File' in hoodie_doc['fields']
        has_text = 'Full Text' in hoodie_doc['fields']
        
        print(f"📚 Document: {title}")
        print(f"📎 PDF File: {'✅ Uploaded' if has_file else '❌ Missing'}")
        
        if has_text:
            text_length = len(hoodie_doc['fields']['Full Text'])
            print(f"📝 Text Extraction: ✅ COMPLETE!")
            print(f"📏 Content Length: {text_length:,} characters")
            
            # Quick content preview
            content = hoodie_doc['fields']['Full Text']
            preview = content[:200].replace('\n', ' ').strip()
            print(f"👀 Preview: {preview}...")
            
            return True
        else:
            print(f"📝 Text Extraction: ⏳ Still processing...")
            print(f"💡 Tip: Large PDFs can take 5-15 minutes to extract")
            return False
            
    except Exception as e:
        print(f"❌ Error checking status: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Checking Hoodie Economics status...\n")
    ready = check_hoodie_status()
    
    if ready:
        print(f"\n🚀 Ready for enhanced processing!")
        print(f"💡 Run: python full_enhanced_indexer.py")
    else:
        print(f"\n⏳ Still waiting for PDF extraction...")
        print(f"💡 Check again in a few minutes with: python quick_status_check.py") 