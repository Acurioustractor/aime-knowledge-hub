#!/usr/bin/env python3
import os
import requests
from dotenv import load_dotenv

load_dotenv()

AIRTABLE_API_KEY = os.getenv('AIRTABLE_API_KEY')
AIRTABLE_BASE_ID = os.getenv('AIRTABLE_BASE_ID')

print(f"Using Base ID: {AIRTABLE_BASE_ID}")
print(f"Using API Key: {AIRTABLE_API_KEY[:20]}...")

# Same filter as the API
filter_formula = "OR({Status}='Processed',{Status}='Indexed')"
url = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/Documents?filterByFormula={filter_formula}"

headers = {
    'Authorization': f'Bearer {AIRTABLE_API_KEY}',
}

print(f"\nQuerying: {url}")

try:
    response = requests.get(url, headers=headers)
    print(f"Response status: {response.status_code}")
    
    if response.ok:
        data = response.json()
        print(f"Total records found: {len(data['records'])}")
        
        for record in data['records']:
            fields = record['fields']
            print(f"\nRecord ID: {record['id']}")
            print(f"  Title: {fields.get('Title', 'No title')}")
            print(f"  Status: {fields.get('Status', 'No status')}")
            print(f"  Author: {fields.get('Author', 'No author')}")
            print(f"  Date: {fields.get('Date', 'No date')}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")

# Also try getting ALL documents (no filter)
print("\n" + "="*50)
print("Getting ALL documents (no filter):")

try:
    url_all = f"https://api.airtable.com/v0/{AIRTABLE_BASE_ID}/Documents"
    response_all = requests.get(url_all, headers=headers)
    
    if response_all.ok:
        data_all = response_all.json()
        print(f"Total ALL records: {len(data_all['records'])}")
        
        for record in data_all['records']:
            fields = record['fields']
            print(f"\nRecord ID: {record['id']}")
            print(f"  Title: {fields.get('Title', 'No title')}")
            print(f"  Status: {fields.get('Status', 'No status')}")
    else:
        print(f"Error getting all: {response_all.text}")
        
except Exception as e:
    print(f"Error getting all: {e}") 