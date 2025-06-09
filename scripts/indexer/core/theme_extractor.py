import os
import logging
from typing import List, Dict, Set
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
import json
import re

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ThemeExtractor:
    def __init__(self):
        """Initialize the theme extractor with API clients"""
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.documents_table = self.airtable_api.table(os.getenv('AIRTABLE_BASE_ID'), 'Documents')
        self.themes_table = self.airtable_api.table(os.getenv('AIRTABLE_BASE_ID'), 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Cache existing themes
        self.existing_themes = self._load_existing_themes()
        
    def _load_existing_themes(self) -> Dict[str, str]:
        """Load existing themes from Airtable"""
        themes = {}
        try:
            records = self.themes_table.all()
            for record in records:
                name = record['fields'].get('Name')
                description = record['fields'].get('Description', '')
                if name:
                    themes[name.lower()] = description
            logger.info(f"Loaded {len(themes)} existing themes")
        except Exception as e:
            logger.error(f"Error loading themes: {e}")
        return themes
    
    def extract_themes_from_text(self, text: str, document_title: str = "") -> List[Dict[str, str]]:
        """Extract themes from document text using OpenAI"""
        try:
            # Truncate text if too long (OpenAI has token limits)
            max_chars = 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "..."
            
            prompt = f"""
            Analyze the following document and extract the main themes/topics it covers.
            
            Document Title: {document_title}
            
            Document Content:
            {text}
            
            Please identify 3-8 main themes that this document covers. For each theme, provide:
            1. A concise theme name (2-4 words)
            2. A brief description of what this theme encompasses
            
            Focus on themes that would be useful for organizing and finding documents in a knowledge management system.
            
            Respond in JSON format:
            {{
                "themes": [
                    {{
                        "name": "Theme Name",
                        "description": "Brief description of what this theme covers"
                    }}
                ]
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model='gpt-4',
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing documents and extracting relevant themes for knowledge organization."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            try:
                result = json.loads(content)
                return result.get('themes', [])
            except json.JSONDecodeError:
                # Try to extract themes from text if JSON parsing fails
                logger.warning("Failed to parse JSON, attempting text extraction")
                return self._extract_themes_from_text_fallback(content)
                
        except Exception as e:
            logger.error(f"Error extracting themes: {e}")
            return []
    
    def _extract_themes_from_text_fallback(self, text: str) -> List[Dict[str, str]]:
        """Fallback method to extract themes if JSON parsing fails"""
        themes = []
        lines = text.split('\n')
        
        for line in lines:
            # Look for patterns like "Theme: Description" or "- Theme Name: Description"
            match = re.search(r'(?:^|\-|\*)\s*([A-Za-z\s]+?):\s*(.+)', line.strip())
            if match:
                name = match.group(1).strip().title()
                description = match.group(2).strip()
                if len(name) > 2 and len(description) > 10:
                    themes.append({
                        "name": name,
                        "description": description
                    })
        
        return themes[:8]  # Limit to 8 themes
    
    def create_or_update_theme(self, theme_name: str, theme_description: str) -> str:
        """Create a new theme or update existing one in Airtable"""
        try:
            # Check if theme already exists (case-insensitive)
            existing_theme = None
            for record in self.themes_table.all():
                if record['fields'].get('Name', '').lower() == theme_name.lower():
                    existing_theme = record
                    break
            
            if existing_theme:
                # Update existing theme if description is better
                existing_desc = existing_theme['fields'].get('Description', '')
                if len(theme_description) > len(existing_desc):
                    self.themes_table.update(existing_theme['id'], {
                        'Description': theme_description
                    })
                    logger.info(f"Updated theme: {theme_name}")
                return existing_theme['id']
            else:
                # Create new theme
                record = self.themes_table.create({
                    'Name': theme_name,
                    'Description': theme_description,
                    'Count': 0  # Will be updated later
                })
                logger.info(f"Created new theme: {theme_name}")
                self.existing_themes[theme_name.lower()] = theme_description
                return record['id']
                
        except Exception as e:
            logger.error(f"Error creating/updating theme {theme_name}: {e}")
            return None
    
    def assign_themes_to_document(self, document_id: str, theme_names: List[str]):
        """Assign themes to a document in Airtable"""
        try:
            # Get theme IDs
            theme_ids = []
            for theme_name in theme_names:
                for record in self.themes_table.all():
                    if record['fields'].get('Name', '').lower() == theme_name.lower():
                        theme_ids.append(record['id'])
                        break
            
            if theme_ids:
                # Update document with theme links
                self.documents_table.update(document_id, {
                    'Topics': theme_ids  # Assuming 'Topics' is the linked field name
                })
                logger.info(f"Assigned {len(theme_ids)} themes to document {document_id}")
            
        except Exception as e:
            logger.error(f"Error assigning themes to document {document_id}: {e}")
    
    def process_document(self, document_id: str, text: str, title: str = "") -> List[str]:
        """Process a single document to extract and assign themes"""
        logger.info(f"Processing document: {title}")
        
        # Extract themes from text
        extracted_themes = self.extract_themes_from_text(text, title)
        
        theme_names = []
        for theme_data in extracted_themes:
            theme_name = theme_data.get('name', '').strip()
            theme_description = theme_data.get('description', '').strip()
            
            if theme_name and theme_description:
                # Create or update theme
                theme_id = self.create_or_update_theme(theme_name, theme_description)
                if theme_id:
                    theme_names.append(theme_name)
        
        # Assign themes to document
        if theme_names:
            self.assign_themes_to_document(document_id, theme_names)
        
        return theme_names
    
    def process_all_unthemed_documents(self):
        """Process all documents that don't have themes assigned"""
        try:
            # Get all documents
            documents = self.documents_table.all()
            
            for doc in documents:
                # Check if document already has themes
                topics = doc['fields'].get('Topics', [])
                if not topics:  # No themes assigned yet
                    text = doc['fields'].get('Full Text', '')
                    title = doc['fields'].get('Title', '')
                    
                    if text and len(text) > 100:  # Only process if there's substantial text
                        themes = self.process_document(doc['id'], text, title)
                        logger.info(f"Assigned themes to '{title}': {themes}")
                    else:
                        logger.warning(f"Skipping document '{title}' - insufficient text")
                        
        except Exception as e:
            logger.error(f"Error processing documents: {e}")
    
    def update_theme_counts(self):
        """Update the count field for each theme based on document assignments"""
        try:
            themes = self.themes_table.all()
            documents = self.documents_table.all()
            
            # Count documents for each theme
            theme_counts = {}
            for doc in documents:
                doc_themes = doc['fields'].get('Topics', [])
                for theme_id in doc_themes:
                    theme_counts[theme_id] = theme_counts.get(theme_id, 0) + 1
            
            # Update theme records
            for theme in themes:
                count = theme_counts.get(theme['id'], 0)
                if theme['fields'].get('Count', 0) != count:
                    self.themes_table.update(theme['id'], {'Count': count})
                    logger.info(f"Updated count for theme '{theme['fields'].get('Name')}': {count}")
                    
        except Exception as e:
            logger.error(f"Error updating theme counts: {e}")

def main():
    """Main function to run theme extraction"""
    extractor = ThemeExtractor()
    
    logger.info("Starting automated theme extraction...")
    
    # Process all unthemed documents
    extractor.process_all_unthemed_documents()
    
    # Update theme counts
    extractor.update_theme_counts()
    
    logger.info("Theme extraction completed!")

if __name__ == "__main__":
    main() 