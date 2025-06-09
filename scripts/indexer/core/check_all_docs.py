#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

api = Api(os.getenv('AIRTABLE_API_KEY'))
table = api.table('appXnYfeQJjdRuySn', 'Documents')

records = table.all()
print('All documents in Airtable:')
for record in records:
    fields = record["fields"]
    print(f'- {fields.get("Title", "No title")} (ID: {record["id"]})')
    if 'Word Count' in fields:
        print(f'  Word Count: {fields["Word Count"]}')
    if 'Date' in fields:
        print(f'  Date: {fields["Date"]}')
    if 'Author' in fields:
        print(f'  Author: {fields["Author"]}')
    print() 