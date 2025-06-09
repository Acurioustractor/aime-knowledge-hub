#!/usr/bin/env python3
"""
Monitor multiple new documents for text extraction completion and auto-process.
"""

import os
import time
import requests
import json
from dotenv import load_dotenv
import subprocess
from datetime import datetime

load_dotenv()

# Documents to monitor
MONITOR_DOCS = [
    {
        "name": "Hoodie Economics",
        "keywords": ["hoodie", "economics"],
        "type": "PDF Book"
    },
    {
        "name": "NATION Tour Video Transcript", 
        "keywords": ["nation", "tour", "video", "transcript"],
        "type": "Video Transcript"
    }
]

def check_all_documents():
    """Check status of all monitored documents."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        results = []
        
        for doc_config in MONITOR_DOCS:
            found_doc = None
            
            for record in data.get('records', []):
                title = record['fields'].get('Title', '').lower()
                
                # Check if any keywords match
                if any(keyword in title for keyword in doc_config["keywords"]):
                    found_doc = record
                    break
            
            if found_doc:
                has_text = 'Full Text' in found_doc['fields']
                text_length = len(found_doc['fields']['Full Text']) if has_text else 0
                
                results.append({
                    'config': doc_config,
                    'record': found_doc,
                    'has_text': has_text,
                    'text_length': text_length,
                    'title': found_doc['fields'].get('Title', 'Unknown'),
                    'doc_id': found_doc['id']
                })
            else:
                results.append({
                    'config': doc_config,
                    'record': None,
                    'has_text': False,
                    'text_length': 0,
                    'title': 'Not Found',
                    'doc_id': None
                })
        
        return results
        
    except Exception as e:
        print(f"❌ Error checking documents: {e}")
        return []

def run_enhanced_processing():
    """Run the enhanced indexer on new documents."""
    print("\n🚀 Running enhanced processing on all new documents...")
    try:
        result = subprocess.run(['python', 'full_enhanced_indexer.py'], 
                              capture_output=True, text=True, timeout=600)  # 10 minute timeout
        
        print("📊 Processing Output:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️ Warnings/Errors:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("⏰ Processing timed out after 10 minutes")
        return False
    except Exception as e:
        print(f"❌ Error running processing: {e}")
        return False

def print_status_update(results, check_count, max_checks):
    """Print a formatted status update."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"\n📊 Status Update {check_count}/{max_checks} - {timestamp}")
    print("=" * 60)
    
    ready_docs = []
    waiting_docs = []
    
    for result in results:
        doc_name = result['config']['name']
        doc_type = result['config']['type']
        
        if result['record'] is None:
            print(f"🔍 {doc_name} ({doc_type}): Not found yet")
            waiting_docs.append(doc_name)
        elif result['has_text']:
            text_len = result['text_length']
            print(f"✅ {doc_name} ({doc_type}): READY! ({text_len:,} chars)")
            ready_docs.append(doc_name)
        else:
            print(f"⏳ {doc_name} ({doc_type}): Still extracting text...")
            waiting_docs.append(doc_name)
    
    print(f"\n📈 Summary: {len(ready_docs)} ready, {len(waiting_docs)} waiting")
    
    return ready_docs, waiting_docs

def main():
    print("🎯 Monitoring Multiple Documents for Text Extraction...")
    print("📄 Watching: Hoodie Economics + NATION Tour Video Transcript")
    print("⏰ Started monitoring at:", datetime.now().strftime("%H:%M:%S"))
    
    check_count = 0
    max_checks = 120  # 20 minutes maximum (10 second intervals)
    processed = False
    
    while check_count < max_checks and not processed:
        check_count += 1
        results = check_all_documents()
        
        ready_docs, waiting_docs = print_status_update(results, check_count, max_checks)
        
        # If any documents are ready, process them
        if ready_docs and not processed:
            print(f"\n🎉 {len(ready_docs)} document(s) ready for processing!")
            
            for doc_name in ready_docs:
                print(f"✨ {doc_name} - Text extraction complete")
            
            # Run enhanced processing
            success = run_enhanced_processing()
            
            if success:
                print("\n🚀 ENHANCED PROCESSING COMPLETE!")
                print("✅ All ready documents have been processed")
                print("🔍 Documents now available for RAG chat queries")
                print("\n💡 Try these queries:")
                for doc_name in ready_docs:
                    print(f"   - 'What is {doc_name} about?'")
                processed = True
            else:
                print("\n⚠️ Processing completed with some issues")
                processed = True
        
        if not processed:
            time.sleep(10)  # Wait 10 seconds between checks
    
    if not processed:
        print(f"\n⏰ Monitoring timeout after {max_checks * 10 / 60:.1f} minutes")
        print("💡 Text extraction taking longer than expected")
        print("🔄 You can run this script again or check manually:")
        print("   python quick_status_check.py")
        print("   python full_enhanced_indexer.py")

if __name__ == "__main__":
    main() 