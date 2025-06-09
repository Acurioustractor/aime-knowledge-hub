#!/usr/bin/env python3
"""
Fix Theme Names - AIME Knowledge Hub

This script checks the actual field structure and displays proper theme names.
"""

import os
import sys
from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

def fix_theme_names():
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    print("🔍 Checking Theme Table Structure")
    print("=" * 60)
    
    themes_table = api.table(base_id, 'Themes')
    themes = themes_table.all()
    
    print(f"🎯 Found {len(themes)} themes")
    print()
    
    # Check the first few themes to see what fields are available
    print("📋 Sample theme records and their fields:")
    print("-" * 60)
    
    for i, theme in enumerate(themes[:5]):
        print(f"\n🎯 Theme {i+1}:")
        print(f"   ID: {theme['id']}")
        print(f"   Fields: {list(theme['fields'].keys())}")
        print(f"   Field values: {theme['fields']}")
    
    print("\n🔍 All possible field names in themes:")
    all_field_names = set()
    for theme in themes:
        all_field_names.update(theme['fields'].keys())
    
    for field_name in sorted(all_field_names):
        print(f"   - {field_name}")
    
    print("\n📊 Themes with proper names:")
    print("-" * 60)
    
    # Try different possible field names for the theme name
    possible_name_fields = ['Theme Name', 'Name', 'Theme', 'Title']
    name_field = None
    
    for field in possible_name_fields:
        if any(field in theme['fields'] for theme in themes):
            name_field = field
            break
    
    if name_field:
        print(f"✅ Found name field: '{name_field}'")
        print()
        
        for theme in themes:
            theme_name = theme['fields'].get(name_field, 'Unknown')
            linked_docs = theme['fields'].get('Documents', [])
            count = len(linked_docs)
            
            if count > 0:  # Only show themes that have documents
                print(f"🎯 {theme_name:<40} | Documents: {count}")
    else:
        print("❌ Could not find theme name field!")
        print("Available fields:", all_field_names)

if __name__ == "__main__":
    fix_theme_names() 