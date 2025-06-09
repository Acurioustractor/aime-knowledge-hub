#!/usr/bin/env python3
"""
Enhanced Document Indexer - Basic Version
Works with current Airtable schema, demonstrates enhanced metadata extraction
"""

import os
import re
import logging
from typing import Dict
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
import json
from datetime import datetime
from langdetect import detect

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BasicEnhancedIndexer:
    def __init__(self):
        """Initialize the enhanced indexer"""
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = self.airtable_api.table(self.base_id, 'Documents')
        self.themes_table = self.airtable_api.table(self.base_id, 'Themes')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def extract_enhanced_metadata(self, text: str, title: str) -> Dict:
        """Extract comprehensive metadata from document text"""
        logger.info("Extracting enhanced metadata...")
        metadata = {}
        
        # 1. Extract Author
        metadata['author'] = self.extract_author(text, title)
        
        # 2. Generate Summary  
        metadata['summary'] = self.generate_summary(text, title)
        
        # 3. Calculate Word Count
        metadata['word_count'] = self.calculate_word_count(text)
        
        # 4. Detect Language
        metadata['language'] = self.detect_language(text)
        
        # 5. Extract Date
        metadata['date'] = self.extract_date(text, title)
        
        # 6. Get Relevant Themes
        metadata['themes'] = self.get_relevant_themes(text, title)
        
        return metadata
    
    def extract_author(self, text: str, title: str) -> str:
        """Extract author from document content"""
        try:
            # Look for author patterns
            author_patterns = [
                r'(?:Author|By|Written by|Created by):\s*([^\n]+)',
                r'(?:Author|By|Written by|Created by)\s+([^\n]+)',
            ]
            
            for pattern in author_patterns:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    author = match.group(1).strip()
                    if len(author) < 50:
                        return author
            
            # Use AI for author extraction
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extract the author name from this document. Return only the name, or 'Unknown' if no clear author is found."},
                    {"role": "user", "content": f"Title: {title}\n\nFirst 1000 chars: {text[:1000]}"}
                ],
                max_tokens=50,
                temperature=0
            )
            
            author = response.choices[0].message.content.strip()
            return author if author.lower() != 'unknown' else 'Unknown'
            
        except Exception as e:
            logger.warning(f"Error extracting author: {e}")
            return 'Unknown'
    
    def generate_summary(self, text: str, title: str) -> str:
        """Generate AI summary of the document"""
        try:
            # Truncate for API limits
            truncated_text = text[:8000] if len(text) > 8000 else text
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Generate a comprehensive 3-4 sentence summary that captures the main themes, key insights, and practical implications of this document."},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {truncated_text}"}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.warning(f"Error generating summary: {e}")
            return f"Document about {title.lower()} covering organizational transformation and business innovation."
    
    def calculate_word_count(self, text: str) -> int:
        """Calculate word count"""
        words = re.findall(r'\b\w+\b', text)
        return len(words)
    
    def detect_language(self, text: str) -> str:
        """Detect document language"""
        try:
            detected_lang = detect(text[:1000])
            lang_map = {
                'en': 'English', 'es': 'Spanish', 'fr': 'French', 
                'de': 'German', 'it': 'Italian', 'pt': 'Portuguese'
            }
            return lang_map.get(detected_lang, detected_lang.upper())
        except:
            return 'English'
    
    def extract_date(self, text: str, title: str) -> str:
        """Extract document date"""
        try:
            date_patterns = [
                r'(\d{4}-\d{2}-\d{2})',
                r'(\d{1,2}/\d{1,2}/\d{4})',
                r'(\w+ \d{1,2},? \d{4})',
            ]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, text)
                if matches:
                    return matches[0]
            
            return datetime.now().strftime('%Y-%m-%d')
        except:
            return datetime.now().strftime('%Y-%m-%d')
    
    def get_relevant_themes(self, text: str, title: str) -> list:
        """Get relevant themes for the document"""
        try:
            # Get existing themes
            existing_themes = self.themes_table.all()
            theme_names = [theme['fields'].get('Name', '') for theme in existing_themes]
            
            if not theme_names:
                return []
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"""Analyze this document and identify the 3-5 most relevant themes from this list: {', '.join(theme_names[:15])}

Return only themes that strongly match the content. Return as a JSON array."""},
                    {"role": "user", "content": f"Title: {title}\n\nContent: {text[:6000]}"}
                ],
                max_tokens=150,
                temperature=0.3
            )
            
            result = response.choices[0].message.content.strip()
            
            try:
                themes = json.loads(result)
                return [theme for theme in themes if theme in theme_names][:5]
            except:
                return []
                
        except Exception as e:
            logger.warning(f"Error extracting themes: {e}")
            return []
    
    def analyze_document(self, record_id: str):
        """Analyze a document and show enhanced metadata (without updating Airtable)"""
        try:
            logger.info(f"Analyzing document {record_id}...")
            
            # Get document
            record = self.documents_table.get(record_id)
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled')
            full_text = fields.get('Full Text', '')
            
            if not full_text:
                logger.error("No full text found")
                return
            
            # Extract enhanced metadata
            metadata = self.extract_enhanced_metadata(full_text, title)
            
            # Display results
            print(f"\n" + "="*60)
            print(f"ENHANCED METADATA ANALYSIS")
            print(f"="*60)
            print(f"📄 Document: {title}")
            print(f"👤 Author: {metadata['author']}")
            print(f"🌍 Language: {metadata['language']}")
            print(f"📊 Word Count: {metadata['word_count']:,} words")
            print(f"📅 Date: {metadata['date']}")
            print(f"\n📝 AI-Generated Summary:")
            print(f"   {metadata['summary']}")
            print(f"\n🏷️  Relevant Themes ({len(metadata['themes'])}):")
            for i, theme in enumerate(metadata['themes'], 1):
                print(f"   {i}. {theme}")
            print(f"="*60)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            return None

def main():
    """Demonstrate enhanced metadata extraction"""
    indexer = BasicEnhancedIndexer()
    
    # Get the first document (AIME Business Cases)
    docs = indexer.documents_table.all()
    if docs:
        record_id = docs[0]['id']
        indexer.analyze_document(record_id)
    else:
        print("No documents found!")

if __name__ == "__main__":
    main() 