#!/usr/bin/env python3
"""
Final Completion Processor for AIME Knowledge Hub Documents

This script handles all remaining metadata completion issues:
- Missing summaries
- Missing word counts  
- All documents completion
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
        logging.FileHandler('final_completion.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class FinalCompletionProcessor:
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
            2. 3-5 relevant themes/tags (comma-separated, simple words)
            
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
    
    def process_all_documents(self):
        """Complete processing for all documents that need it"""
        logger.info("🎯 AIME Knowledge Hub - Final Completion Processor")
        logger.info("================================================")
        
        # Get all documents
        records = self.table.all()
        logger.info(f"Retrieved {len(records)} documents from Airtable")
        
        # Documents that specifically need completion
        target_documents = [
            'rec6KXadBjSgmQ2Qp',  # Citizens - Business case
            'recAOtKF00bJWwbCJ',  # IN {TV} Full Report  
            'recDNArTEGqLo7u9n',  # Mentor Credit - Business Case
            'recDSuzFz7t5qzvE0',  # Systems Change Residency: - Business Case
            'recG3twq8Kx2R2ypr',  # IKSL - Business case
            'recHPVRGxDee7hDSO',  # Presidents - Business Case
            'recb9WYbZVabylslv',  # IMAGI-Labs - Business case
            'recqOZl5K1MgAD5BB',  # Custodians - Business case
        ]
        
        docs_to_process = []
        
        # Find documents that need completion
        for record in records:
            record_id = record['id']
            if record_id in target_documents:
                fields = record['fields']
                title = fields.get('Title', 'Untitled')
                has_text = bool(fields.get('Full Text', '').strip())
                has_summary = bool(fields.get('Summary', '').strip())
                word_count = fields.get('Word Count', 0)
                
                if has_text and (not has_summary or word_count == 0):
                    docs_to_process.append(record)
                    logger.info(f"🔄 Will process: {title}")
        
        logger.info(f"Found {len(docs_to_process)} documents needing final completion")
        
        # Process each document
        for i, record in enumerate(docs_to_process, 1):
            fields = record['fields']
            title = fields.get('Title', 'Untitled')
            text = fields.get('Full Text', '')
            
            logger.info(f"\n📄 Processing {i}/{len(docs_to_process)}: {title}")
            
            updates = {}
            
            # Generate summary if missing
            if not fields.get('Summary', '').strip():
                logger.info("  📝 Generating summary...")
                summary, themes = self.generate_summary_and_themes(text, title)
                if summary:
                    updates['Summary'] = summary
                    logger.info(f"  ✅ Summary: {summary[:100]}...")
            
            # Calculate word count if missing or zero
            current_word_count = fields.get('Word Count', 0)
            if current_word_count == 0:
                word_count = self.count_words(text)
                updates['Word Count'] = word_count
                logger.info(f"  📊 Word count: {word_count}")
            
            # Set language if missing
            if not fields.get('Language', '').strip():
                updates['Language'] = 'English'
                logger.info("  🌐 Language: English")
            
            # Ensure status is set
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
        
        logger.info(f"\n🎉 Final completion processing finished!")
        logger.info("📋 Note: Theme field format issues will be resolved separately")

def main():
    processor = FinalCompletionProcessor()
    processor.process_all_documents()

if __name__ == "__main__":
    main() 