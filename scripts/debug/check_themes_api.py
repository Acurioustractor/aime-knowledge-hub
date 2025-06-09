#!/usr/bin/env python3
import os
import requests
from pyairtable import Api

# Check Airtable directly
api = Api(os.getenv('AIRTABLE_API_KEY'))
table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Themes')

print("=== THEMES IN AIRTABLE (Top 15) ===")
themes = table.all(sort=['Count-desc'])
for i, theme in enumerate(themes[:15]):
    name = theme['fields'].get('Name', 'Unknown')
    count = theme['fields'].get('Count', 0)
    docs = theme['fields'].get('Documents', [])
    print(f'{i+1}. {name}: Count={count}, Actual Linked={len(docs)}')

print(f"\nTotal themes in Airtable: {len(themes)}")

# Check API response
print("\n=== THEMES FROM API (Top 15) ===")
try:
    response = requests.get('http://localhost:3000/api/themes')
    if response.ok:
        api_data = response.json()
        api_themes = api_data.get('themes', [])
        for i, theme in enumerate(api_themes[:15]):
            print(f'{i+1}. {theme["name"]}: {theme["count"]}')
        print(f"\nTotal themes from API: {len(api_themes)}")
    else:
        print(f"API Error: {response.status_code}")
except Exception as e:
    print(f"Error calling API: {e}") 