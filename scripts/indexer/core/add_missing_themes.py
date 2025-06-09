#!/usr/bin/env python3
"""
Script to add missing themes to Airtable.
"""

import os
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

def add_missing_themes():
    """Add missing themes that might be needed."""
    
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    themes_table = api.table(base_id, 'Themes')
    
    new_themes = [
        {'Name': 'Business Strategy', 'Description': 'Business strategy and organizational development'},
        {'Name': 'Innovation', 'Description': 'Innovation and new business models'},
        {'Name': 'Social Impact', 'Description': 'Social impact and community development'},
        {'Name': 'Technology', 'Description': 'Technology solutions and implementations'},
        {'Name': 'Leadership', 'Description': 'Leadership and management practices'}
    ]
    
    for theme in new_themes:
        try:
            record = themes_table.create(theme)
            print(f"✅ Added theme: {theme['Name']}")
        except Exception as e:
            print(f"⚠️  Theme {theme['Name']} may already exist: {e}")

if __name__ == "__main__":
    add_missing_themes() 