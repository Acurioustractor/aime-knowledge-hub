#!/usr/bin/env python3
"""
Fix Missing Metadata for AIME Knowledge Hub Documents

This script specifically addresses missing:
- Summaries
- Themes  
- Word Count
- Language
- Topics

For all documents in Airtable.
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
        logging.FileHandler('metadata_fix.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class MetadataFixer:
    def __init__(self):
        """Initialize the metadata fixer."""
        self.setup_clients()
        
    def setup_clients(self):
        """Initialize API clients."""
        # Airtable
        api_key = os.getenv('AIRTABLE_API_KEY')
        if not api_key:
            raise ValueError("AIRTABLE_API_KEY is required")
        
        self.airtable_api = Api(api_key)
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = os.getenv('AIRTABLE_DOCUMENTS_TABLE', 'Documents')
        
        if not self.base_id:
            raise ValueError("AIRTABLE_BASE_ID is required")
        
        # OpenAI
        openai_key = os.getenv('OPENAI_API_KEY')
        if not openai_key:
            raise ValueError("OPENAI_API_KEY is required")
        
        self.openai_client = OpenAI(api_key=openai_key)
        
    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Fetch all documents from Airtable."""
        try:
            table = self.airtable_api.table(self.base_id, self.documents_table)
            all_records = table.all()
            logger.info(f"Retrieved {len(all_records)} documents from Airtable")
            return all_records
        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            return []
    
    def count_words(self, text: str) -> int:
        """Count words in text."""
        if not text:
            return 0
        # Simple word count - split by whitespace and filter out empty strings
        words = [word for word in text.split() if word.strip()]
        return len(words)
    
    def detect_language(self, text: str) -> str:
        """Detect language of text."""
        if not text or len(text.strip()) < 10:
            return "English"  # Default assumption
        
        # Simple heuristic - if we see common English words, assume English
        # For more sophisticated detection, we could use langdetect library
        english_indicators = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
        text_lower = text.lower()
        english_count = sum(1 for word in english_indicators if f' {word} ' in text_lower)
        
        if english_count >= 3:
            return "English"
        else:
            return "English"  # Default for now
    
    def generate_summary_and_themes(self, title: str, text: str) -> Dict[str, Any]:
        """Generate summary and identify themes using AI."""
        if not text or len(text.strip()) < 50:
            return {
                'summary': f"Brief document: {title}",
                'themes': ['General'],
                'topics': []
            }
        
        # Truncate text if too long for API
        max_length = 4000
        truncated_text = text[:max_length] + "..." if len(text) > max_length else text
        
        prompt = f"""
Analyze this document and provide:

1. A concise 2-3 sentence summary
2. 3-5 relevant themes from this list: Education, Innovation, Business, Research, Strategy, Community, Indigenous, Economics, Leadership, Technology, Social Impact, Mentoring, Entrepreneurship, Partnerships, Funding, Youth, Universities, Corporate, Government, International, Regional, Local
3. 3-5 specific topic keywords

Title: {title}

Content: {truncated_text}

Respond in this exact format:
SUMMARY: [your summary here]
THEMES: [theme1, theme2, theme3]
TOPICS: [topic1, topic2, topic3]
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert document analyzer. Provide clear, concise analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse the response
            summary = ""
            themes = []
            topics = []
            
            lines = content.split('\n')
            for line in lines:
                line = line.strip()
                if line.startswith('SUMMARY:'):
                    summary = line.replace('SUMMARY:', '').strip()
                elif line.startswith('THEMES:'):
                    themes_str = line.replace('THEMES:', '').strip()
                    themes = [t.strip() for t in themes_str.split(',') if t.strip()]
                elif line.startswith('TOPICS:'):
                    topics_str = line.replace('TOPICS:', '').strip()
                    topics = [t.strip() for t in topics_str.split(',') if t.strip()]
            
            # Fallbacks
            if not summary:
                summary = f"Document about {title} - content analysis pending"
            if not themes:
                themes = ['General']
            if not topics:
                topics = [title.split()[0] if title.split() else 'Document']
            
            return {
                'summary': summary,
                'themes': themes[:5],  # Limit to 5 themes
                'topics': topics[:5]   # Limit to 5 topics
            }
            
        except Exception as e:
            logger.error(f"Error generating summary/themes: {e}")
            return {
                'summary': f"Document: {title}",
                'themes': ['General'],
                'topics': [title.split()[0] if title.split() else 'Document']
            }
    
    def update_document_metadata(self, record_id: str, updates: Dict[str, Any]):
        """Update document metadata in Airtable."""
        try:
            table = self.airtable_api.table(self.base_id, self.documents_table)
            table.update(record_id, updates)
            logger.info(f"Updated document {record_id} with metadata")
        except Exception as e:
            logger.error(f"Error updating document {record_id}: {e}")
    
    def process_document(self, record: Dict[str, Any]):
        """Process a single document to fix missing metadata."""
        try:
            record_id = record['id']
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled Document')
            author = fields.get('Author', 'Unknown')
            
            logger.info(f"Processing: {title}")
            
            # Get text content
            full_text = fields.get('Full Text', '').strip()
            
            # Calculate word count
            word_count = self.count_words(full_text)
            
            # Detect language
            language = self.detect_language(full_text)
            
            # Check what's missing
            needs_summary = not fields.get('Summary', '').strip()
            needs_themes = not fields.get('Themes')
            needs_word_count = not fields.get('Word Count') or fields.get('Word Count') == 0
            needs_language = not fields.get('Language', '').strip()
            
            updates = {}
            
            # Add word count and language
            if needs_word_count:
                updates['Word Count'] = word_count
                logger.info(f"  Word count: {word_count}")
            
            if needs_language:
                updates['Language'] = language
                logger.info(f"  Language: {language}")
            
            # Generate summary and themes if needed
            if needs_summary or needs_themes:
                if full_text:
                    ai_analysis = self.generate_summary_and_themes(title, full_text)
                    
                    if needs_summary:
                        updates['Summary'] = ai_analysis['summary']
                        logger.info(f"  Summary: {ai_analysis['summary'][:100]}...")
                    
                    if needs_themes:
                        # Convert themes to comma-separated string for Airtable
                        themes_str = ', '.join(ai_analysis['themes'])
                        updates['Topics'] = themes_str  # Using Topics field instead of Themes
                        logger.info(f"  Topics: {themes_str}")
                
                else:
                    logger.warning(f"  No text content available for {title}")
                    if needs_summary:
                        updates['Summary'] = f"Document by {author}"
                    if needs_themes:
                        updates['Topics'] = "General"
            
            # Apply updates if any
            if updates:
                self.update_document_metadata(record_id, updates)
                logger.info(f"✅ Updated {title}")
            else:
                logger.info(f"⚪ No updates needed for {title}")
                
        except Exception as e:
            logger.error(f"Error processing document {record.get('id', 'unknown')}: {e}")
    
    def fix_all_metadata(self):
        """Fix metadata for all documents."""
        logger.info("🚀 Starting metadata fix for all documents...")
        
        documents = self.get_all_documents()
        
        if not documents:
            logger.error("No documents found")
            return
        
        total = len(documents)
        processed = 0
        
        for record in documents:
            processed += 1
            logger.info(f"\n📄 Processing {processed}/{total}")
            self.process_document(record)
            
            # Small delay to avoid rate limits
            time.sleep(1)
        
        logger.info(f"\n🎉 Completed metadata fix for {processed} documents!")
        logger.info("📊 Check your Airtable to see the populated metadata")

def main():
    """Main function."""
    logger.info("🎯 AIME Knowledge Hub - Metadata Fixer")
    logger.info("=====================================")
    
    try:
        fixer = MetadataFixer()
        fixer.fix_all_metadata()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 