#!/usr/bin/env python3
import json
import requests
import sys

try:
    response = requests.get("http://localhost:3002/api/documents")
    data = response.json()
    
    if 'error' in data:
        print(f'API Error: {data["error"]}')
    else:
        print('API Response Analysis:')
        print(f'Total documents: {len(data["documents"])}')
        print('\nDocument IDs from API:')
        for doc in data['documents']:
            print(f'- {doc["id"]}: {doc["title"]}')
        
        expected_ids = ['recItj6oIkKuRjbCD', 'recaCr1FTrDiRR7mN', 'recrdX7MvnjRfkQaz', 'rectbX1JHy6Ap1I7H']
        api_ids = [doc['id'] for doc in data['documents']]
        
        print(f'\nExpected Airtable IDs: {expected_ids}')
        print(f'Actual API IDs: {api_ids}')
        print(f'Mismatch detected: {set(api_ids) != set(expected_ids)}')
        
except Exception as e:
    print(f'Error: {e}') 