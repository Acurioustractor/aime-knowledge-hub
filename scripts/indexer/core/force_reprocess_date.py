#!/usr/bin/env python3
"""
Force reprocess the date for No Shame at AIME research paper.
"""

import os
import re
from dotenv import load_dotenv
import requests
from datetime import datetime

load_dotenv()

def force_reprocess_date():
    """Force reprocess the date extraction for research paper."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    # Get the document
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    shame_doc = None
    for record in data.get('records', []):
        title = record['fields'].get('Title', '')
        if 'no shame' in title.lower():
            shame_doc = record
            break
    
    if not shame_doc:
        print("❌ No Shame at AIME document not found")
        return
    
    print(f"📄 Found document: {shame_doc['fields']['Title']}")
    
    # Get the full text
    full_text = shame_doc['fields'].get('Full Text', '')
    
    # Test the improved date extraction
    print("\n🔍 Testing improved date extraction:")
    
    # Academic patterns (should find 2018)
    academic_patterns = [
        r'©[^0-9]*(\d{4})',  # Copyright YYYY
        r'The Author\(s\)\s*(\d{4})',  # "The Author(s) YYYY"
        r'Published[^0-9]*(\d{4})',  # Published YYYY
        r'Publication Date:?\s*([A-Za-z]+ \d{4})',  # Publication Date: Month YYYY
        r'Date[^0-9]*(\d{4})',  # General date patterns
    ]
    
    found_dates = []
    
    for i, pattern in enumerate(academic_patterns):
        matches = re.findall(pattern, full_text[:5000], re.IGNORECASE)
        if matches:
            print(f"   Pattern {i+1}: {pattern} -> Found: {matches}")
            found_dates.extend(matches)
    
    # Find the best date
    extracted_date = None
    for match in found_dates:
        year = re.search(r'(19|20)\d{2}', str(match))
        if year:
            year_val = int(year.group())
            if 1990 <= year_val <= 2030:
                extracted_date = match if len(str(match)) > 4 else str(year_val)
                break
    
    print(f"\n📅 Current date in Airtable: {shame_doc['fields'].get('Date', 'None')}")
    print(f"📅 Extracted date from content: {extracted_date}")
    
    if extracted_date and extracted_date != shame_doc['fields'].get('Date'):
        print(f"\n🔧 Updating date to: {extracted_date}")
        
        update_url = f"https://api.airtable.com/v0/{base_id}/Documents/{shame_doc['id']}"
        update_data = {
            "fields": {
                "Date": extracted_date
            }
        }
        
        update_response = requests.patch(update_url, headers=headers, json=update_data)
        
        if update_response.status_code == 200:
            print("✅ Successfully updated date!")
        else:
            print(f"❌ Failed to update date: {update_response.status_code}")
    else:
        print("ℹ️ Date is already correct or couldn't extract")

if __name__ == "__main__":
    force_reprocess_date() 