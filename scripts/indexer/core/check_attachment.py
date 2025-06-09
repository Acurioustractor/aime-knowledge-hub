#!/usr/bin/env python3
"""
Script to check the attachment details from Airtable.
"""

import os
import requests
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

def check_attachments():
    """Check the attachment details for the AIME Business Cases Summary."""
    
    # Initialize Airtable
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    table = api.table(base_id, 'Documents')
    
    # Find the AIME Business Cases Summary
    records = table.all()
    for record in records:
        if 'AIME Business Cases Summary' in record['fields'].get('Title', ''):
            print(f"📄 Found document: {record['fields']['Title']}")
            print(f"   ID: {record['id']}")
            
            attachments = record['fields'].get('File', [])
            if attachments:
                for i, attachment in enumerate(attachments):
                    print(f"\n📎 Attachment {i+1}:")
                    print(f"   Filename: {attachment.get('filename', 'Unknown')}")
                    print(f"   Type: {attachment.get('type', 'Unknown')}")
                    print(f"   Size: {attachment.get('size', 'Unknown')} bytes")
                    print(f"   URL: {attachment['url']}")
                    
                    # Try to fetch the content
                    try:
                        response = requests.head(attachment['url'])
                        print(f"   Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
                        print(f"   Content-Length: {response.headers.get('Content-Length', 'Unknown')}")
                        
                        # Try to get a sample of the content
                        response = requests.get(attachment['url'])
                        content = response.text[:200]
                        print(f"   Sample content: {content}...")
                        
                    except Exception as e:
                        print(f"   Error fetching: {e}")
            else:
                print("   No attachments found")
            break

if __name__ == "__main__":
    check_attachments() 