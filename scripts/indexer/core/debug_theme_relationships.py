#!/usr/bin/env python3
"""
Debug Theme Relationships - AIME Knowledge Hub

This script debugs and fixes the theme-document relationship issues.
"""

import os
import sys
from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

def debug_theme_relationships():
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    print("🔍 Debugging Theme-Document Relationships")
    print("=" * 60)
    
    # Get all documents and their themes
    docs_table = api.table(base_id, 'Documents')
    themes_table = api.table(base_id, 'Themes')
    
    documents = docs_table.all()
    themes = themes_table.all()
    
    print(f"📄 Found {len(documents)} documents")
    print(f"🎯 Found {len(themes)} themes")
    print()
    
    # Check what themes are linked to documents
    print("📋 Document → Theme relationships:")
    print("-" * 60)
    
    theme_usage_count = {}
    
    for doc in documents:
        title = doc['fields'].get('Title', 'Untitled')[:40]
        doc_themes = doc['fields'].get('Themes', [])
        
        print(f"📄 {title:<40} | Themes: {len(doc_themes)}")
        
        if doc_themes:
            print(f"   Theme IDs: {doc_themes}")
            
            # Count theme usage
            for theme_id in doc_themes:
                if theme_id in theme_usage_count:
                    theme_usage_count[theme_id] += 1
                else:
                    theme_usage_count[theme_id] = 1
        else:
            print(f"   ⚠️ NO THEMES LINKED")
        print()
    
    print("\n🎯 Theme usage summary:")
    print("-" * 60)
    
    # Check what themes exist and their document links
    for theme in themes:
        theme_id = theme['id']
        theme_name = theme['fields'].get('Theme Name', 'Unknown')
        linked_docs = theme['fields'].get('Documents', [])
        
        actual_usage = theme_usage_count.get(theme_id, 0)
        
        print(f"🎯 {theme_name:<30} | Airtable links: {len(linked_docs):<3} | Actual usage: {actual_usage}")
        
        if len(linked_docs) != actual_usage:
            print(f"   ⚠️ MISMATCH! Expected {actual_usage}, got {len(linked_docs)}")
        
        if len(linked_docs) == 0 and actual_usage > 0:
            print(f"   🔧 NEEDS FIX: Theme used {actual_usage} times but shows 0 documents")
    
    print("\n🔧 Fixing relationships...")
    print("-" * 60)
    
    # The issue might be that we need to update both sides of the relationship
    # Let's try to refresh the theme records
    
    fixes_applied = 0
    
    for doc in documents:
        doc_id = doc['id']
        title = doc['fields'].get('Title', 'Untitled')
        doc_themes = doc['fields'].get('Themes', [])
        
        if doc_themes:
            try:
                # Re-save the document with its themes to refresh the relationship
                docs_table.update(doc_id, {'Themes': doc_themes})
                print(f"✅ Refreshed {title}")
                fixes_applied += 1
            except Exception as e:
                print(f"❌ Failed to refresh {title}: {e}")
    
    print(f"\n🎉 Applied {fixes_applied} relationship fixes")
    
    # Check the results
    print("\n📊 Checking results...")
    themes_after = themes_table.all()
    
    print("\n🎯 Theme counts after fix:")
    print("-" * 60)
    
    for theme in themes_after:
        theme_name = theme['fields'].get('Theme Name', 'Unknown')
        linked_docs = theme['fields'].get('Documents', [])
        print(f"🎯 {theme_name:<30} | Documents: {len(linked_docs)}")

if __name__ == "__main__":
    debug_theme_relationships() 