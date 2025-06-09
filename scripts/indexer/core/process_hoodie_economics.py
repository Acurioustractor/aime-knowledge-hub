#!/usr/bin/env python3
"""
Manual processing script for Hoodie Economics PDF
This bypasses Airtable's slow text extraction
"""

import os
import requests
from dotenv import load_dotenv
from pyairtable import Api
import PyPDF2
import io

load_dotenv()

def download_and_extract_pdf_text(pdf_url):
    """Download PDF and extract text using PyPDF2"""
    print(f"📥 Downloading PDF from: {pdf_url}")
    
    response = requests.get(pdf_url)
    if response.status_code != 200:
        raise Exception(f"Failed to download PDF: {response.status_code}")
    
    print("📖 Extracting text from PDF...")
    pdf_file = io.BytesIO(response.content)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    text = ""
    for page_num in range(len(pdf_reader.pages)):
        page = pdf_reader.pages[page_num]
        text += page.extract_text() + "\n"
    
    print(f"✅ Extracted {len(text)} characters from {len(pdf_reader.pages)} pages")
    return text

def clean_text_for_airtable(text):
    """Clean text to make it compatible with Airtable"""
    # Remove null characters and other problematic characters
    text = text.replace('\x00', '')
    text = text.replace('\ufffd', '')  # Remove replacement characters
    
    # Airtable has a 100,000 character limit for long text fields
    if len(text) > 99000:
        print(f"⚠️  Text too long ({len(text)} chars), truncating to 99,000 characters")
        text = text[:99000] + "\n\n[... Text truncated due to length ...]"
    
    return text

def update_airtable_record(record_id, full_text):
    """Update the Airtable record with extracted text"""
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')
    
    # Clean the text for Airtable compatibility
    cleaned_text = clean_text_for_airtable(full_text)
    
    print(f"📝 Updating Airtable record with {len(cleaned_text)} characters...")
    table.update(record_id, {
        'Full Text': cleaned_text,
        'Status': 'Indexed'
    })
    print("✅ Airtable record updated!")

def main():
    # Get the Hoodie Economics record
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table('appXnYfeQJjdRuySn', 'Documents')
    
    print("🔍 Finding Hoodie Economics record...")
    records = table.all()
    
    hoodie_record = None
    for record in records:
        if record['fields'].get('Title') == 'Hoodie Economics':
            hoodie_record = record
            break
    
    if not hoodie_record:
        print("❌ Hoodie Economics record not found!")
        return
    
    print(f"📄 Found record: {hoodie_record['id']}")
    
    # Check if already has text
    if hoodie_record['fields'].get('Full Text'):
        print("✅ Record already has Full Text! Processing with enhanced indexer...")
        # TODO: Run enhanced indexer
        return
    
    # Get PDF URL
    file_field = hoodie_record['fields'].get('File')
    if not file_field or not file_field[0].get('url'):
        print("❌ No PDF file found in record!")
        return
    
    pdf_url = file_field[0]['url']
    
    try:
        # Extract text from PDF
        full_text = download_and_extract_pdf_text(pdf_url)
        
        # Update Airtable
        update_airtable_record(hoodie_record['id'], full_text)
        
        print("🎉 Hoodie Economics is now ready for enhanced processing!")
        print("👉 Next step: Run the enhanced indexer to analyze the content")
        
    except Exception as e:
        print(f"❌ Error processing PDF: {e}")

if __name__ == "__main__":
    main() 