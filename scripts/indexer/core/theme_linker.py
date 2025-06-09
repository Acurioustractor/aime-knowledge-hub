#!/usr/bin/env python3
"""
Theme Linking Script
Links documents to relevant themes and updates theme counts
"""

import os
import logging
from typing import List
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ThemeLinker:
    def __init__(self):
        """Initialize the theme linker"""
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = self.airtable_api.table(self.base_id, 'Documents')
        self.themes_table = self.airtable_api.table(self.base_id, 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Cache themes for efficiency
        self.themes_cache = {}
        self.load_themes_cache()
    
    def load_themes_cache(self):
        """Load all themes into cache for fast lookup"""
        try:
            themes = self.themes_table.all()
            for theme in themes:
                name = theme['fields'].get('Name', '')
                if name:
                    self.themes_cache[name] = theme['id']
            logger.info(f"Loaded {len(self.themes_cache)} themes into cache")
        except Exception as e:
            logger.error(f"Error loading themes cache: {e}")
    
    def find_relevant_themes(self, text: str, title: str, max_themes: int = 5) -> List[str]:
        """Find relevant themes for a document using AI"""
        try:
            theme_names = list(self.themes_cache.keys())
            if not theme_names:
                logger.warning("No themes available")
                return []
            
            # Truncate text for API limits
            max_chars = 6000
            truncated_text = text[:max_chars] if len(text) > max_chars else text
            
            # Create prompt with all available themes
            themes_list = ', '.join(theme_names)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"""Analyze this document and identify the most relevant themes from this list: {themes_list}

Instructions:
- Select 3-5 themes that strongly match the document content
- Only use themes from the provided list
- Focus on main themes, not minor mentions
- Return as a JSON array of theme names
- Be selective - only choose themes that are truly relevant"""},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {truncated_text}"}
                ],
                max_tokens=200,
                temperature=0.2
            )
            
            result = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                themes = json.loads(result)
                # Validate themes exist in our cache
                valid_themes = [theme for theme in themes if theme in self.themes_cache]
                return valid_themes[:max_themes]
            except json.JSONDecodeError:
                # Fallback: try to extract themes from comma-separated text
                themes = [theme.strip().strip('"') for theme in result.split(',')]
                valid_themes = [theme for theme in themes if theme in self.themes_cache]
                return valid_themes[:max_themes]
                
        except Exception as e:
            logger.error(f"Error finding relevant themes: {e}")
            return []
    
    def link_document_to_themes(self, document_id: str, theme_names: List[str]) -> bool:
        """Link a document to specific themes"""
        try:
            if not theme_names:
                logger.info(f"No themes to link for document {document_id}")
                return True
            
            # Get theme record IDs
            theme_ids = []
            for theme_name in theme_names:
                if theme_name in self.themes_cache:
                    theme_ids.append(self.themes_cache[theme_name])
                else:
                    logger.warning(f"Theme not found in cache: {theme_name}")
            
            if not theme_ids:
                logger.warning(f"No valid theme IDs found for document {document_id}")
                return False
            
            # Update document with theme links
            update_data = {'Themes': theme_ids}
            self.documents_table.update(document_id, update_data)
            
            logger.info(f"Linked document {document_id} to {len(theme_ids)} themes: {', '.join(theme_names)}")
            return True
            
        except Exception as e:
            logger.error(f"Error linking document {document_id} to themes: {e}")
            return False
    
    def update_theme_counts(self):
        """Update the count field for all themes based on linked documents"""
        try:
            logger.info("Updating theme counts...")
            
            # Get all themes with their linked documents
            themes = self.themes_table.all()
            
            for theme in themes:
                theme_id = theme['id']
                theme_name = theme['fields'].get('Name', 'Unknown')
                linked_docs = theme['fields'].get('Documents', [])
                count = len(linked_docs) if linked_docs else 0
                
                # Update count field
                self.themes_table.update(theme_id, {'Count': count})
                logger.info(f"Updated {theme_name}: {count} documents")
            
            logger.info("Theme counts updated successfully")
            
        except Exception as e:
            logger.error(f"Error updating theme counts: {e}")
    
    def process_document(self, document_id: str) -> bool:
        """Process a single document to link relevant themes"""
        try:
            # Get document
            record = self.documents_table.get(document_id)
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled')
            full_text = fields.get('Full Text', '')
            
            if not full_text:
                logger.warning(f"No full text found for document {title}")
                return False
            
            logger.info(f"Processing themes for: {title}")
            
            # Find relevant themes
            relevant_themes = self.find_relevant_themes(full_text, title)
            
            if not relevant_themes:
                logger.info(f"No relevant themes found for {title}")
                return True
            
            # Link document to themes
            success = self.link_document_to_themes(document_id, relevant_themes)
            
            if success:
                logger.info(f"Successfully linked {title} to themes: {', '.join(relevant_themes)}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            return False
    
    def process_all_documents(self):
        """Process all documents to link them to relevant themes"""
        try:
            logger.info("Starting theme linking process for all documents...")
            
            # Get all documents
            documents = self.documents_table.all()
            
            processed = 0
            successful = 0
            
            for doc in documents:
                document_id = doc['id']
                title = doc['fields'].get('Title', 'Untitled')
                
                # Skip if already has theme links (unless you want to re-process)
                existing_themes = doc['fields'].get('Themes', [])
                if existing_themes:
                    logger.info(f"Skipping {title} - already has {len(existing_themes)} theme links")
                    continue
                
                processed += 1
                if self.process_document(document_id):
                    successful += 1
            
            logger.info(f"Theme linking completed: {successful}/{processed} documents processed successfully")
            
            # Update theme counts
            self.update_theme_counts()
            
        except Exception as e:
            logger.error(f"Error processing all documents: {e}")

def main():
    """Run the theme linking process"""
    linker = ThemeLinker()
    linker.process_all_documents()

if __name__ == "__main__":
    main() 