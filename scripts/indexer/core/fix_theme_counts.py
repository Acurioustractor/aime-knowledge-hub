#!/usr/bin/env python3
"""
Fix Theme Counts - AIME Knowledge Hub

This script fixes the Count field in themes to match actual document relationships.
"""

import os
import sys
from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

def fix_theme_counts():
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    print("🔧 Fixing Theme Counts in Airtable")
    print("=" * 60)
    
    themes_table = api.table(base_id, 'Themes')
    themes = themes_table.all()
    
    print(f"🎯 Found {len(themes)} themes to check")
    print()
    
    fixes_needed = 0
    fixes_applied = 0
    
    for theme in themes:
        theme_id = theme['id']
        theme_name = theme['fields'].get('Name', 'Unknown')
        current_count = theme['fields'].get('Count', 0)
        linked_docs = theme['fields'].get('Documents', [])
        actual_count = len(linked_docs)
        
        if current_count != actual_count:
            print(f"🔧 {theme_name:<40} | Current: {current_count:<3} | Actual: {actual_count}")
            fixes_needed += 1
            
            try:
                # Update the count field
                themes_table.update(theme_id, {'Count': actual_count})
                print(f"   ✅ Updated count from {current_count} to {actual_count}")
                fixes_applied += 1
            except Exception as e:
                print(f"   ❌ Failed to update: {e}")
        else:
            if actual_count > 0:  # Only show themes with documents
                print(f"✅ {theme_name:<40} | Count: {actual_count} (correct)")
    
    print(f"\n📊 Summary:")
    print(f"   Themes needing fixes: {fixes_needed}")
    print(f"   Fixes applied: {fixes_applied}")
    
    if fixes_applied > 0:
        print(f"\n🎉 Successfully updated {fixes_applied} theme counts!")
    else:
        print(f"\n✅ All theme counts were already correct!")

if __name__ == "__main__":
    fix_theme_counts() 