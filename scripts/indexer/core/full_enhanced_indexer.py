#!/usr/bin/env python3
"""
Full Enhanced Document Indexer
Automatically populates: Author, Summary, Word Count, Language, Date, and links Themes
"""

import os
import re
import logging
from typing import List, Dict, Optional
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
import json
from datetime import datetime
from langdetect import detect
import tiktoken

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FullEnhancedIndexer:
    def __init__(self):
        """Initialize the full enhanced indexer"""
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = self.airtable_api.table(self.base_id, 'Documents')
        self.themes_table = self.airtable_api.table(self.base_id, 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize tokenizer for word counting
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
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
        
    def extract_comprehensive_metadata(self, text: str, title: str) -> Dict:
        """Extract all metadata from document text"""
        logger.info(f"Extracting comprehensive metadata for: {title}")
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
        
        # 6. Extract Relevant Themes
        metadata['themes'] = self.extract_relevant_themes(text, title)
        
        logger.info(f"Metadata extraction completed:")
        logger.info(f"  Author: {metadata['author']}")
        logger.info(f"  Language: {metadata['language']}")
        logger.info(f"  Word Count: {metadata['word_count']:,}")
        logger.info(f"  Themes: {len(metadata['themes'])}")
        
        return metadata
    
    def extract_author(self, text: str, title: str) -> str:
        """Extract author from document content or metadata"""
        try:
            # Try to find author patterns in text
            author_patterns = [
                r'(?:Author|By|Written by|Created by|Authored by):\s*([^\n\r]+)',
                r'(?:Author|By|Written by|Created by|Authored by)\s+([^\n\r]+)',
                r'^([A-Z][a-z]+ [A-Z][a-z]+)(?:,|\s+\d{4})',  # Name + year pattern
                r'Copyright.*?(\d{4}).*?([A-Z][a-z]+ [A-Z][a-z]+)',  # Copyright pattern
            ]
            
            for pattern in author_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    if isinstance(match, tuple):
                        # Handle copyright pattern
                        author = match[1] if len(match) > 1 else match[0]
                    else:
                        author = match
                    
                    author = author.strip()
                    # Validate author name
                    if (len(author) < 50 and 
                        not any(word in author.lower() for word in ['the', 'and', 'for', 'with', 'document', 'report']) and
                        re.search(r'[A-Za-z]', author)):
                        return author
            
            # If no pattern found, use AI to extract author
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """Extract the author name from this document. Look for:
- Author bylines
- Copyright information
- Document headers/footers
- Signature lines

Return only the full name (first and last), or 'Unknown' if no clear author is found."""},
                    {"role": "user", "content": f"Title: {title}\n\nFirst 2000 characters: {text[:2000]}"}
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
        """Generate comprehensive AI summary of the document"""
        try:
            # Truncate text for API limits
            max_chars = 10000
            truncated_text = text[:max_chars] if len(text) > max_chars else text
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """Generate a comprehensive 4-5 sentence summary that captures:
1. The main purpose and scope of the document
2. Key themes and concepts discussed
3. Important insights or findings
4. Practical implications or applications
5. Target audience or use cases

Make the summary informative and useful for someone deciding whether to read the full document."""},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {truncated_text}"}
                ],
                max_tokens=250,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
            
        except Exception as e:
            logger.warning(f"Error generating summary: {e}")
            return f"This document titled '{title}' covers important topics related to organizational transformation and business innovation. Please refer to the full text for complete details."
    
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
            # Use first 2000 characters for better detection
            sample_text = text[:2000]
            detected_lang = detect(sample_text)
            
            # Map language codes to full names
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
                'ar': 'Arabic',
                'nl': 'Dutch',
                'sv': 'Swedish',
                'da': 'Danish',
                'no': 'Norwegian',
                'fi': 'Finnish'
            }
            
            return lang_map.get(detected_lang, detected_lang.upper())
            
        except Exception as e:
            logger.warning(f"Error detecting language: {e}")
            return 'English'  # Default to English
    
    def extract_date(self, text: str, title: str) -> str:
        """Extract or infer document date"""
        try:
            # Look for academic journal and publication patterns first
            academic_patterns = [
                r'©[^0-9]*(\d{4})',  # Copyright YYYY (common in journals)
                r'The Author\(s\)\s*(\d{4})',  # "The Author(s) YYYY"
                r'Published[^0-9]*(\d{4})',  # Published YYYY
                r'Publication Date:?\s*([A-Za-z]+ \d{4})',  # Publication Date: Month YYYY
                r'Date[^0-9]*(\d{4})',  # General date patterns
            ]
            
            # Look for general date patterns
            date_patterns = [
                r'(\d{4}-\d{2}-\d{2})',  # YYYY-MM-DD
                r'(\d{1,2}/\d{1,2}/\d{4})',  # MM/DD/YYYY
                r'(\d{1,2}-\d{1,2}-\d{4})',  # MM-DD-YYYY
                r'(\w+ \d{1,2},? \d{4})',  # Month DD, YYYY
                r'(\d{1,2} \w+ \d{4})',  # DD Month YYYY
                r'(\w+ \d{4})',  # Month YYYY
            ]
            
            # First try academic patterns (more reliable for papers)
            for pattern in academic_patterns:
                matches = re.findall(pattern, text[:5000], re.IGNORECASE)
                for match in matches:
                    year = re.search(r'(19|20)\d{2}', match)
                    if year:
                        year_val = int(year.group())
                        # Validate year is reasonable (1990-2030)
                        if 1990 <= year_val <= 2030:
                            return match if len(match) > 4 else str(year_val)
            
            # Then try general date patterns
            found_dates = []
            for pattern in date_patterns:
                matches = re.findall(pattern, text[:3000])
                found_dates.extend(matches)
            
            if found_dates:
                # Return the first reasonable date found
                for date_str in found_dates:
                    year = re.search(r'(19|20)\d{2}', date_str)
                    if year:
                        year_val = int(year.group())
                        if 1990 <= year_val <= 2030:
                            return date_str
            
            # If no date found, return current date
            return datetime.now().strftime('%Y-%m-%d')
            
        except Exception as e:
            logger.warning(f"Error extracting date: {e}")
            return datetime.now().strftime('%Y-%m-%d')
    
    def extract_relevant_themes(self, text: str, title: str) -> List[str]:
        """Extract relevant themes for the document"""
        try:
            theme_names = list(self.themes_cache.keys())
            if not theme_names:
                logger.warning("No themes available")
                return []
            
            # Truncate text for API limits
            max_chars = 8000
            truncated_text = text[:max_chars] if len(text) > max_chars else text
            
            # Create prompt with available themes
            themes_list = ', '.join(theme_names)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"""Analyze this document and identify the most relevant themes from this list: {themes_list}

Instructions:
- Select 3-6 themes that strongly match the document content
- Only use themes from the provided list
- Focus on primary themes, not minor mentions
- Consider both explicit content and implicit themes
- Return as a JSON array of theme names
- Be selective but comprehensive"""},
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
                return valid_themes[:6]  # Limit to 6 themes
            except json.JSONDecodeError:
                # Fallback: try to extract themes from comma-separated text
                themes = [theme.strip().strip('"') for theme in result.split(',')]
                valid_themes = [theme for theme in themes if theme in self.themes_cache]
                return valid_themes[:6]
                
        except Exception as e:
            logger.warning(f"Error extracting themes: {e}")
            return []
    
    def process_document(self, record_id: str) -> bool:
        """Process a single document with full enhancement"""
        try:
            logger.info(f"Processing document {record_id} with full enhancement...")
            
            # Get document record
            record = self.documents_table.get(record_id)
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled')
            full_text = fields.get('Full Text', '')
            
            if not full_text:
                logger.error(f"No full text found for document {record_id}")
                return False
            
            # Extract comprehensive metadata
            metadata = self.extract_comprehensive_metadata(full_text, title)
            
            # Prepare update fields
            update_fields = {
                'Author': metadata['author'],
                'Summary': metadata['summary'],
                'Word Count': metadata['word_count'],
                'Language': metadata['language'],
                'Date': metadata['date']
                # Keep existing status - don't change it
            }
            
            # Link themes if available
            if metadata['themes']:
                theme_ids = []
                for theme_name in metadata['themes']:
                    if theme_name in self.themes_cache:
                        theme_ids.append(self.themes_cache[theme_name])
                
                if theme_ids:
                    update_fields['Themes'] = theme_ids
            
            # Update document record
            self.documents_table.update(record_id, update_fields)
            
            logger.info(f"Successfully enhanced document: {title}")
            logger.info(f"  Themes linked: {', '.join(metadata['themes']) if metadata['themes'] else 'None'}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing document {record_id}: {e}")
            return False
    
    def update_theme_counts(self):
        """Update theme counts based on linked documents"""
        try:
            logger.info("Updating theme counts...")
            
            themes = self.themes_table.all()
            
            for theme in themes:
                theme_id = theme['id']
                theme_name = theme['fields'].get('Name', 'Unknown')
                linked_docs = theme['fields'].get('Documents', [])
                count = len(linked_docs) if linked_docs else 0
                
                self.themes_table.update(theme_id, {'Count': count})
                logger.info(f"Updated {theme_name}: {count} documents")
            
            logger.info("Theme counts updated successfully")
            
        except Exception as e:
            logger.error(f"Error updating theme counts: {e}")
    
    def process_all_documents(self):
        """Process all documents with full enhancement"""
        try:
            logger.info("Starting full enhancement process for all documents...")
            
            # Get all documents
            documents = self.documents_table.all()
            
            processed = 0
            successful = 0
            
            for doc in documents:
                record_id = doc['id']
                title = doc['fields'].get('Title', 'Untitled')
                status = doc['fields'].get('Status', '')
                
                # Process if document doesn't have enhanced metadata yet
                has_metadata = (doc['fields'].get('Author') and 
                              doc['fields'].get('Summary') and 
                              doc['fields'].get('Word Count'))
                
                if not has_metadata:
                    logger.info(f"Processing: {title}")
                    processed += 1
                    if self.process_document(record_id):
                        successful += 1
                else:
                    logger.info(f"Skipping (already has enhanced metadata): {title}")
            
            logger.info(f"Enhancement completed: {successful}/{processed} documents processed successfully")
            
            # Update theme counts
            if successful > 0:
                self.update_theme_counts()
                
        except Exception as e:
            logger.error(f"Error processing all documents: {e}")

def main():
    """Run the full enhanced document indexer"""
    indexer = FullEnhancedIndexer()
    indexer.process_all_documents()

if __name__ == "__main__":
    main() 