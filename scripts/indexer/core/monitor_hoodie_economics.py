#!/usr/bin/env python3
"""
Monitor for Hoodie Economics PDF text extraction completion and auto-process.
"""

import os
import time
import requests
import json
from dotenv import load_dotenv
import subprocess

load_dotenv()

def check_document_status():
    """Check if Hoodie Economics has full text extracted."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        for record in data.get('records', []):
            title = record['fields'].get('Title', '')
            if 'hoodie' in title.lower() and 'economics' in title.lower():
                has_file = 'File' in record['fields']
                has_text = 'Full Text' in record['fields']
                
                if has_text:
                    text_length = len(record['fields']['Full Text'])
                    return True, title, text_length, record['id']
                else:
                    return False, title, 0, record['id']
        
        return None, None, 0, None
        
    except Exception as e:
        print(f"Error checking status: {e}")
        return None, None, 0, None

def run_enhanced_processing():
    """Run the enhanced indexer on the new document."""
    print("\n🚀 Running enhanced processing...")
    try:
        result = subprocess.run(['python', 'full_enhanced_indexer.py'], 
                              capture_output=True, text=True, timeout=300)
        
        print("📊 Processing Output:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️ Warnings/Errors:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("⏰ Processing timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Error running processing: {e}")
        return False

def main():
    print("👀 Monitoring Hoodie Economics PDF text extraction...")
    print("📄 Waiting for Airtable to complete PDF content extraction...")
    
    check_count = 0
    max_checks = 60  # 10 minutes maximum
    
    while check_count < max_checks:
        check_count += 1
        has_text, title, text_length, doc_id = check_document_status()
        
        if has_text:
            print(f"\n✅ PDF text extraction COMPLETE!")
            print(f"📖 Document: {title}")
            print(f"📏 Text length: {text_length:,} characters")
            print(f"🆔 Document ID: {doc_id}")
            
            # Run enhanced processing
            success = run_enhanced_processing()
            
            if success:
                print("\n🎉 HOODIE ECONOMICS FULLY PROCESSED!")
                print("✨ Enhanced metadata extraction complete")
                print("🔍 Document ready for RAG chat queries")
                print("\n💡 Try asking: 'What is Hoodie Economics about?'")
            else:
                print("\n⚠️ Processing completed with some issues")
            
            break
            
        elif title:
            print(f"⏳ Check {check_count}/{max_checks}: Still extracting text from '{title}'...")
        else:
            print(f"🔍 Check {check_count}/{max_checks}: Document not found yet...")
            
        time.sleep(10)  # Wait 10 seconds between checks
    
    else:
        print(f"\n⏰ Timeout: PDF text extraction taking longer than expected")
        print("💡 You can manually check Airtable and run 'python full_enhanced_indexer.py' later")

if __name__ == "__main__":
    main() 