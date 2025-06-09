#!/usr/bin/env python3
"""
Script to update theme counts and manage ongoing theme extraction
"""

import os
from dotenv import load_dotenv
from theme_extractor import ThemeExtractor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Update themes and counts"""
    load_dotenv()
    
    extractor = ThemeExtractor()
    
    logger.info("Starting theme management update...")
    
    # Update theme counts based on current document assignments
    extractor.update_theme_counts()
    
    # Process any documents that don't have themes yet
    extractor.process_all_unthemed_documents()
    
    logger.info("Theme management completed!")
    
    # Print summary
    from pyairtable import Api
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    themes_table = api.table('appXnYfeQJjdRuySn', 'Themes')
    themes = themes_table.all()
    
    print(f"\n📊 Theme Summary:")
    print(f"Total themes: {len(themes)}")
    
    # Sort by count descending
    themes_with_counts = [(theme['fields'].get('Name', 'Unnamed'), theme['fields'].get('Count', 0)) for theme in themes]
    themes_with_counts.sort(key=lambda x: x[1], reverse=True)
    
    print(f"\nTop themes by document count:")
    for name, count in themes_with_counts[:10]:
        print(f"  {name}: {count} documents")

if __name__ == "__main__":
    main() 