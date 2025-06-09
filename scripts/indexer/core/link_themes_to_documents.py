#!/usr/bin/env python3
"""
Link Themes to Documents - AIME Knowledge Hub

This script properly links existing themes to documents by:
1. Finding theme record IDs from theme names
2. Updating document records with proper theme links
"""

import os
import sys
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('link_themes.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ThemeLinker:
    def __init__(self):
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = self.airtable_api.table(self.base_id, 'Documents')
        self.themes_table = self.airtable_api.table(self.base_id, 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Cache for theme name to record ID mapping
        self.theme_name_to_id = {}
        self.load_theme_mapping()
    
    def load_theme_mapping(self):
        """Load all themes and create name to ID mapping"""
        logger.info("Loading theme mapping...")
        
        try:
            themes = self.themes_table.all()
            logger.info(f"Found {len(themes)} themes in Airtable")
            
            for theme in themes:
                theme_name = theme['fields'].get('Name', '').strip()
                if theme_name:
                    self.theme_name_to_id[theme_name] = theme['id']
            
            logger.info(f"Mapped {len(self.theme_name_to_id)} theme names to IDs")
            
        except Exception as e:
            logger.error(f"Error loading themes: {e}")
    
    def generate_themes_for_document(self, title: str, summary: str, text_preview: str) -> List[str]:
        """Generate themes for a document using OpenAI"""
        
        prompt = f"""
        Based on this document, generate 3-5 relevant themes that categorize its content.
        
        Title: {title}
        Summary: {summary}
        Content Preview: {text_preview[:1000]}...
        
        Return ONLY a comma-separated list of theme names. Each theme should be 2-4 words.
        Focus on: business concepts, methodologies, impact areas, and key topics.
        
        Examples: "Indigenous Knowledge Systems", "Community Engagement", "Social Impact", "Business Development"
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.3
            )
            
            themes_text = response.choices[0].message.content.strip()
            themes = [theme.strip() for theme in themes_text.split(',')]
            
            logger.info(f"Generated themes for '{title}': {themes}")
            return themes
            
        except Exception as e:
            logger.error(f"Error generating themes for '{title}': {e}")
            return []
    
    def find_or_create_theme(self, theme_name: str) -> Optional[str]:
        """Find existing theme or create new one, return record ID"""
        
        # Check if theme already exists
        if theme_name in self.theme_name_to_id:
            return self.theme_name_to_id[theme_name]
        
        # Create new theme
        try:
            new_theme = self.themes_table.create({
                'Name': theme_name,
                'Description': f'Theme: {theme_name}',
                'Count': 0
            })
            
            theme_id = new_theme['id']
            self.theme_name_to_id[theme_name] = theme_id
            
            logger.info(f"Created new theme: '{theme_name}' ({theme_id})")
            return theme_id
            
        except Exception as e:
            logger.error(f"Error creating theme '{theme_name}': {e}")
            return None
    
    def link_themes_to_document(self, document_id: str, theme_names: List[str]) -> bool:
        """Link themes to document by updating with theme record IDs"""
        
        theme_ids = []
        
        for theme_name in theme_names:
            theme_id = self.find_or_create_theme(theme_name)
            if theme_id:
                theme_ids.append(theme_id)
        
        if not theme_ids:
            logger.warning(f"No valid theme IDs found for document {document_id}")
            return False
        
        try:
            # Update document with theme links
            self.documents_table.update(document_id, {
                'Themes': theme_ids
            })
            
            logger.info(f"Linked {len(theme_ids)} themes to document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error linking themes to document {document_id}: {e}")
            return False
    
    def process_documents_missing_themes(self):
        """Process all documents that are missing theme links"""
        
        logger.info("Starting theme linking process...")
        
        try:
            # Get all documents
            documents = self.documents_table.all()
            logger.info(f"Found {len(documents)} documents")
            
            processed = 0
            linked = 0
            
            for doc in documents:
                fields = doc['fields']
                doc_id = doc['id']
                title = fields.get('Title', 'Untitled')
                
                # Check if document already has themes linked
                existing_themes = fields.get('Themes', [])
                if existing_themes:
                    logger.info(f"Document '{title}' already has {len(existing_themes)} themes linked")
                    continue
                
                # Check if document has required fields
                summary = fields.get('Summary', '')
                full_text = fields.get('Full Text', '')
                
                if not summary or not full_text:
                    logger.warning(f"Document '{title}' missing summary or text, skipping")
                    continue
                
                logger.info(f"Processing document: '{title}'")
                
                # Generate themes
                theme_names = self.generate_themes_for_document(title, summary, full_text)
                
                if theme_names:
                    # Link themes to document
                    if self.link_themes_to_document(doc_id, theme_names):
                        linked += 1
                
                processed += 1
                
                # Rate limiting
                time.sleep(1)
            
            logger.info(f"Processing complete! Processed: {processed}, Successfully linked: {linked}")
            
        except Exception as e:
            logger.error(f"Error in processing: {e}")

def main():
    logger.info("🎯 Starting Theme Linking Process")
    
    linker = ThemeLinker()
    linker.process_documents_missing_themes()
    
    logger.info("✅ Theme linking process completed!")

if __name__ == "__main__":
    main() 