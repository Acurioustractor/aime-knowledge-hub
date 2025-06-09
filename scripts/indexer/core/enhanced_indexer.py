#!/usr/bin/env python3
"""
Enhanced Document Indexer with Automated Field Population
Automatically extracts and populates: Author, Summary, Word Count, Language, Themes
"""

import os
import re
import logging
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
import json
from datetime import datetime
import langdetect
from langdetect import detect
import tiktoken

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedDocumentIndexer:
    def __init__(self):
        """Initialize the enhanced indexer with AI capabilities"""
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = self.airtable_api.table(self.base_id, 'Documents')
        self.themes_table = self.airtable_api.table(self.base_id, 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize tokenizer for word counting
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
    def extract_metadata(self, text: str, title: str) -> Dict:
        """Extract comprehensive metadata from document text"""
        metadata = {}
        
        # 1. Extract Author
        metadata['author'] = self.extract_author(text, title)
        
        # 2. Generate Summary
        metadata['summary'] = self.generate_summary(text, title)
        
        # 3. Calculate Word Count
        metadata['word_count'] = self.calculate_word_count(text)
        
        # 4. Detect Language
        metadata['language'] = self.detect_language(text)
        
        # 5. Extract/Parse Date
        metadata['date'] = self.extract_date(text, title)
        
        # 6. Extract Themes
        metadata['themes'] = self.extract_themes(text, title)
        
        return metadata
    
    def extract_author(self, text: str, title: str) -> str:
        """Extract author from document content or metadata"""
        try:
            # Try to find author patterns in text
            author_patterns = [
                r'(?:Author|By|Written by|Created by):\s*([^\n]+)',
                r'(?:Author|By|Written by|Created by)\s+([^\n]+)',
                r'^([A-Z][a-z]+ [A-Z][a-z]+)(?:,|\s+\d{4})',  # Name + year pattern
            ]
            
            for pattern in author_patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    author = match.group(1).strip()
                    if len(author) < 50 and not any(word in author.lower() for word in ['the', 'and', 'for', 'with']):
                        return author
            
            # If no pattern found, use AI to extract author
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract the author name from this document. Return only the name, or 'Unknown' if no clear author is found."},
                    {"role": "user", "content": f"Title: {title}\n\nText: {text[:1000]}..."}
                ],
                max_tokens=50,
                temperature=0
            )
            
            author = response.choices[0].message.content.strip()
            return author if author and author.lower() != 'unknown' else 'Unknown'
            
        except Exception as e:
            logger.warning(f"Error extracting author: {e}")
            return 'Unknown'
    
    def generate_summary(self, text: str, title: str) -> str:
        """Generate AI summary of the document"""
        try:
            # Truncate text for API limits
            max_chars = 8000
            truncated_text = text[:max_chars] if len(text) > max_chars else text
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Generate a concise 2-3 sentence summary of this document that captures the main points and key insights."},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {truncated_text}"}
                ],
                max_tokens=150,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
            
        except Exception as e:
            logger.warning(f"Error generating summary: {e}")
            return f"Document about {title.lower()} - summary could not be generated."
    
    def calculate_word_count(self, text: str) -> int:
        """Calculate accurate word count"""
        try:
            # Remove extra whitespace and count words
            words = re.findall(r'\b\w+\b', text)
            return len(words)
        except Exception as e:
            logger.warning(f"Error calculating word count: {e}")
            return 0
    
    def detect_language(self, text: str) -> str:
        """Detect document language"""
        try:
            # Use first 1000 characters for language detection
            sample_text = text[:1000]
            detected_lang = detect(sample_text)
            
            # Map language codes to names
            lang_map = {
                'en': 'English',
                'es': 'Spanish',
                'fr': 'French',
                'de': 'German',
                'it': 'Italian',
                'pt': 'Portuguese',
                'zh': 'Chinese',
                'ja': 'Japanese',
                'ko': 'Korean',
                'ru': 'Russian',
                'ar': 'Arabic'
            }
            
            return lang_map.get(detected_lang, detected_lang.upper())
            
        except Exception as e:
            logger.warning(f"Error detecting language: {e}")
            return 'English'  # Default to English
    
    def extract_date(self, text: str, title: str) -> Optional[str]:
        """Extract or infer document date"""
        try:
            # Look for date patterns in text
            date_patterns = [
                r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
                r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
                r'(\w+ \d{1,2},? \d{4})',  # Month DD, YYYY
                r'(\d{1,2} \w+ \d{4})',  # DD Month YYYY
            ]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, text)
                if matches:
                    # Return the first reasonable date found
                    return matches[0]
            
            # If no date found, return None (will use processing date)
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting date: {e}")
            return None
    
    def extract_themes(self, text: str, title: str) -> List[str]:
        """Extract relevant themes from document content"""
        try:
            # Get existing themes from Airtable
            existing_themes = self.themes_table.all()
            theme_names = [theme['fields'].get('Name', '') for theme in existing_themes]
            
            # Truncate text for API limits
            max_chars = 6000
            truncated_text = text[:max_chars] if len(text) > max_chars else text
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"""Analyze this document and identify the most relevant themes from this list: {', '.join(theme_names[:20])}
                    
Return 3-5 themes that best match the content. Only use themes from the provided list. Return as a JSON array of theme names."""},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {truncated_text}"}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                themes = json.loads(result)
                # Validate themes exist in our list
                valid_themes = [theme for theme in themes if theme in theme_names]
                return valid_themes[:5]  # Limit to 5 themes
            except json.JSONDecodeError:
                # Fallback: extract themes from comma-separated text
                themes = [theme.strip() for theme in result.split(',')]
                valid_themes = [theme for theme in themes if theme in theme_names]
                return valid_themes[:5]
                
        except Exception as e:
            logger.warning(f"Error extracting themes: {e}")
            return []
    
    def process_document(self, record_id: str) -> bool:
        """Process a single document with enhanced metadata extraction"""
        try:
            logger.info(f"Processing document {record_id} with enhanced metadata...")
            
            # Get document record
            record = self.documents_table.get(record_id)
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled')
            full_text = fields.get('Full Text', '')
            
            if not full_text:
                logger.error(f"No full text found for document {record_id}")
                return False
            
            # Extract all metadata
            metadata = self.extract_metadata(full_text, title)
            
            # Prepare update fields
            update_fields = {
                'Author': metadata['author'],
                'Summary': metadata['summary'],
                'Word Count': metadata['word_count'],
                'Language': metadata['language'],
                'Status': 'Processed'
            }
            
            # Add date if found
            if metadata['date']:
                update_fields['Date'] = metadata['date']
            else:
                update_fields['Date'] = datetime.now().strftime('%Y-%m-%d')
            
            # Link themes (if we have theme linking set up)
            if metadata['themes']:
                theme_records = []
                for theme_name in metadata['themes']:
                    # Find theme record ID
                    theme_matches = [t for t in self.themes_table.all() if t['fields'].get('Name') == theme_name]
                    if theme_matches:
                        theme_records.append(theme_matches[0]['id'])
                
                if theme_records:
                    update_fields['Themes'] = theme_records
            
            # Update document record
            self.documents_table.update(record_id, update_fields)
            
            logger.info(f"Successfully enhanced document {record_id}:")
            logger.info(f"  Author: {metadata['author']}")
            logger.info(f"  Language: {metadata['language']}")
            logger.info(f"  Word Count: {metadata['word_count']:,}")
            logger.info(f"  Themes: {', '.join(metadata['themes']) if metadata['themes'] else 'None'}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing document {record_id}: {e}")
            return False
    
    def process_all_documents(self):
        """Process all documents in the system"""
        try:
            # Get all documents that need processing
            documents = self.documents_table.all()
            
            for doc in documents:
                record_id = doc['id']
                title = doc['fields'].get('Title', 'Untitled')
                status = doc['fields'].get('Status', '')
                
                # Process if not already processed with enhanced metadata
                if status != 'Processed' or not doc['fields'].get('Summary'):
                    logger.info(f"Processing: {title}")
                    self.process_document(record_id)
                else:
                    logger.info(f"Skipping (already processed): {title}")
                    
        except Exception as e:
            logger.error(f"Error processing documents: {e}")

def main():
    """Run the enhanced document indexer"""
    indexer = EnhancedDocumentIndexer()
    indexer.process_all_documents()

if __name__ == "__main__":
    main() 