#!/usr/bin/env python3
import os
import sys
import requests
from config import load_environment
load_environment()
from pyairtable import Api

print("=== AIRTABLE THEMES DATA ===")
api = Api(os.getenv('AIRTABLE_API_KEY'))
table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Themes')

themes = table.all()
print(f'Total themes in Airtable: {len(themes)}')

# Sort by count descending
sorted_themes = sorted(themes, key=lambda x: x['fields'].get('Count', 0), reverse=True)

print('\nTop 15 themes by count:')
for i, theme in enumerate(sorted_themes[:15]):
    name = theme['fields'].get('Name', 'Unknown')
    count = theme['fields'].get('Count', 0)
    docs = theme['fields'].get('Documents', [])
    print(f'{i+1:2d}. {name:30} Count={count:2d} Linked={len(docs):2d}')

print(f"\n=== API RESPONSE CHECK ===")
try:
    response = requests.get('http://localhost:3000/api/themes', timeout=10)
    if response.ok:
        api_data = response.json()
        api_themes = api_data.get('themes', [])
        print(f'Total themes from API: {len(api_themes)}')
        print('\nTop 15 themes from API:')
        for i, theme in enumerate(api_themes[:15]):
            print(f'{i+1:2d}. {theme["name"]:30} Count={theme["count"]:2d}')
    else:
        print(f"API Error: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"Error calling API: {e}")

print(f"\n=== COMPARISON ===")
if 'api_themes' in locals():
    airtable_names = {t['fields'].get('Name') for t in sorted_themes}
    api_names = {t['name'] for t in api_themes}
    
    missing_from_api = airtable_names - api_names
    if missing_from_api:
        print(f"Themes missing from API: {len(missing_from_api)}")
        for name in list(missing_from_api)[:10]:
            print(f"  - {name}")
    else:
        print("All Airtable themes present in API") 