#!/usr/bin/env python3
"""
Refresh All Themes - AIME Knowledge Hub

This script refreshes all theme associations and ensures they display properly on the frontend.
"""

import os
import sys
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from dotenv import load_dotenv
from pyairtable import Api

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('refresh_themes.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ThemeRefresher:
    def __init__(self):
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY')
        self.airtable_base_id = os.getenv('AIRTABLE_BASE_ID')
        
        if not self.airtable_api_key or not self.airtable_base_id:
            raise ValueError("Missing Airtable configuration")
            
        self.api = Api(self.airtable_api_key)
        self.documents_table = self.api.table(self.airtable_base_id, 'Documents')
        self.themes_table = self.api.table(self.airtable_base_id, 'Themes')
        
    def get_all_themes(self) -> Dict[str, str]:
        """Get all themes and their record IDs"""
        logger.info("📊 Fetching all themes from Airtable...")
        
        themes = {}
        all_records = self.themes_table.all()
        
        for record in all_records:
            theme_name = record['fields'].get('Theme Name', '').strip()
            if theme_name:
                themes[theme_name.lower()] = record['id']
                
        logger.info(f"✅ Found {len(themes)} themes in Airtable")
        return themes
        
    def get_all_documents(self) -> List[Dict]:
        """Get all documents"""
        logger.info("📄 Fetching all documents from Airtable...")
        
        documents = self.documents_table.all()
        logger.info(f"✅ Found {len(documents)} documents in Airtable")
        return documents
        
    def refresh_document_themes(self):
        """Refresh theme associations for all documents"""
        logger.info("🔄 Starting theme refresh process...")
        
        # Get current themes mapping
        themes_map = self.get_all_themes()
        documents = self.get_all_documents()
        
        total_updated = 0
        
        for doc in documents:
            doc_id = doc['id']
            fields = doc['fields']
            title = fields.get('Title', 'Untitled')
            
            logger.info(f"🔍 Processing document: {title}")
            
            # Check current themes
            current_themes = fields.get('Themes', [])
            if current_themes:
                logger.info(f"  Current themes: {len(current_themes)} linked")
                
                # Verify all theme links are valid
                valid_theme_ids = []
                for theme_id in current_themes:
                    # Check if this theme ID exists
                    try:
                        theme_record = self.themes_table.get(theme_id)
                        valid_theme_ids.append(theme_id)
                    except Exception as e:
                        logger.warning(f"  Invalid theme ID removed: {theme_id}")
                        
                # Update if we removed invalid themes
                if len(valid_theme_ids) != len(current_themes):
                    try:
                        self.documents_table.update(doc_id, {'Themes': valid_theme_ids})
                        logger.info(f"  ✅ Updated {title} - removed invalid theme links")
                        total_updated += 1
                    except Exception as e:
                        logger.error(f"  ❌ Failed to update {title}: {e}")
                else:
                    logger.info(f"  ✅ {title} - all theme links valid")
            else:
                logger.warning(f"  ⚠️ {title} - no themes linked")
                
        logger.info(f"🎉 Theme refresh complete! Updated {total_updated} documents")
        
    def verify_frontend_data(self):
        """Verify the data that would be sent to the frontend"""
        logger.info("🔍 Verifying frontend data...")
        
        documents = self.get_all_documents()
        themes_map = self.get_all_themes()
        
        # Reverse map for ID to name lookup
        id_to_theme = {theme_id: theme_name for theme_name, theme_id in themes_map.items()}
        
        for doc in documents:
            fields = doc['fields']
            title = fields.get('Title', 'Untitled')[:40]
            themes = fields.get('Themes', [])
            
            if themes:
                theme_names = []
                for theme_id in themes:
                    if theme_id in id_to_theme:
                        theme_names.append(id_to_theme[theme_id])
                    else:
                        theme_names.append(f"Unknown({theme_id[:8]})")
                        
                logger.info(f"📄 {title:<40} | Themes: {', '.join(theme_names[:3])}{'...' if len(theme_names) > 3 else ''}")
            else:
                logger.warning(f"📄 {title:<40} | ⚠️ NO THEMES")

def main():
    try:
        refresher = ThemeRefresher()
        
        logger.info("🚀 Starting AIME Knowledge Hub theme refresh...")
        
        # Refresh theme associations
        refresher.refresh_document_themes()
        
        # Verify frontend data
        refresher.verify_frontend_data()
        
        logger.info("✅ Theme refresh completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Theme refresh failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 