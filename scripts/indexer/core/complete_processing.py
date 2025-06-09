#!/usr/bin/env python3
"""
Complete Processing for AIME Knowledge Hub Documents

This script completes processing for documents that have text but missing metadata.
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
        logging.FileHandler('complete_processing.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class CompleteProcessor:
    def __init__(self):
        self.airtable_api = Api(os.getenv('AIRTABLE_API_KEY'))
        self.table = self.airtable_api.table(os.getenv('AIRTABLE_BASE_ID'), 'Documents')
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def generate_summary_and_themes(self, text: str, title: str) -> tuple[str, str]:
        """Generate summary and themes for a document"""
        try:
            prompt = f"""
            Analyze this document titled "{title}" and provide:
            
            1. A comprehensive 2-3 sentence summary
            2. 3-5 relevant themes/tags (comma-separated)
            
            Document text:
            {text[:4000]}...
            
            Format your response as:
            SUMMARY: [your summary here]
            THEMES: [theme1, theme2, theme3, etc.]
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Parse response
            summary = ""
            themes = ""
            
            for line in content.split('\n'):
                if line.startswith('SUMMARY:'):
                    summary = line.replace('SUMMARY:', '').strip()
                elif line.startswith('THEMES:'):
                    themes = line.replace('THEMES:', '').strip()
            
            return summary, themes
            
        except Exception as e:
            logger.error(f"Error generating summary/themes: {e}")
            return "", ""
    
    def count_words(self, text: str) -> int:
        """Count words in text"""
        return len(text.split()) if text else 0
    
    def process_incomplete_documents(self):
        """Process documents that have text but missing metadata"""
        logger.info("🎯 AIME Knowledge Hub - Complete Processor")
        logger.info("==========================================")
        
        # Get all documents
        records = self.table.all()
        logger.info(f"Retrieved {len(records)} documents from Airtable")
        
        incomplete_docs = []
        
        # Find documents that need completion
        for record in records:
            fields = record['fields']
            title = fields.get('Title', 'Untitled')
            has_text = bool(fields.get('Full Text', '').strip())
            has_summary = bool(fields.get('Summary', '').strip())
            
            # Handle themes field
            themes_field = fields.get('Themes', '')
            if isinstance(themes_field, list):
                has_themes = len(themes_field) > 0
            else:
                has_themes = bool(str(themes_field).strip()) and str(themes_field) != 'processed'
            
            word_count = fields.get('Word Count', 0)
            
            # If has text but missing other metadata
            if has_text and (not has_summary or not has_themes or word_count == 0):
                incomplete_docs.append(record)
        
        logger.info(f"Found {len(incomplete_docs)} documents needing completion")
        
        # Process each incomplete document
        for i, record in enumerate(incomplete_docs, 1):
            fields = record['fields']
            title = fields.get('Title', 'Untitled')
            text = fields.get('Full Text', '')
            
            logger.info(f"\n📄 Processing {i}/{len(incomplete_docs)}: {title}")
            
            updates = {}
            
            # Generate summary if missing
            if not fields.get('Summary', '').strip():
                logger.info("  Generating summary...")
                summary, themes = self.generate_summary_and_themes(text, title)
                if summary:
                    updates['Summary'] = summary
                    logger.info(f"  Summary: {summary[:100]}...")
                
                if themes:
                    updates['Themes'] = themes
                    logger.info(f"  Themes: {themes}")
            
            # Calculate word count if missing
            if not fields.get('Word Count', 0):
                word_count = self.count_words(text)
                updates['Word Count'] = word_count
                logger.info(f"  Word count: {word_count}")
            
            # Set language if missing
            if not fields.get('Language', '').strip():
                updates['Language'] = 'English'
                logger.info("  Language: English")
            
            # Update status
            updates['Status'] = 'Indexed'
            
            # Apply updates
            if updates:
                try:
                    self.table.update(record['id'], updates)
                    logger.info(f"✅ Updated {title}")
                    time.sleep(1)  # Rate limiting
                except Exception as e:
                    logger.error(f"❌ Error updating {title}: {e}")
            else:
                logger.info(f"⚪ No updates needed for {title}")
        
        logger.info(f"\n🎉 Completed processing {len(incomplete_docs)} documents!")

def main():
    processor = CompleteProcessor()
    processor.process_incomplete_documents()

if __name__ == "__main__":
    main() 