#!/usr/bin/env python3
"""
Fix Themes Format Issue - Update documents without the problematic themes field
"""

import os
import sys
import time
import logging
from dotenv import load_dotenv
from pyairtable import Api

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fix_themes.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def fix_documents():
    """Update documents with the metadata we generated, excluding themes field"""
    
    api = Api(os.getenv('AIRTABLE_API_KEY'))
    table = api.table(os.getenv('AIRTABLE_BASE_ID'), 'Documents')
    
    # Documents and their metadata from the processing log
    documents_to_update = [
        {
            'id': 'rec6KXadBjSgmQ2Qp',
            'title': 'Citizens - Business case',
            'summary': 'The document "Citizens - Business case" advocates for a shift from traditional heroic entrepreneurship to collaborative, relational approaches that prioritize collective intelligence and systemic change. It emphasizes the importance of building networks and communities that can address complex social challenges through shared knowledge and resources. The initiative aims to create sustainable impact by fostering environments where diverse stakeholders can contribute to meaningful transformation.',
            'word_count': 5378
        },
        {
            'id': 'recAOtKF00bJWwbCJ',
            'title': 'IN {TV} Full Report',
            'summary': 'The "IN {TV} Full Report" outlines the educational impact of the IMAGI-NATION{TV} initiative, detailing how it engages students and communities through innovative content and resources. The report highlights the program\'s success in fostering critical thinking and environmental awareness among participants. It emphasizes the importance of storytelling and media in driving social change and inspiring action towards sustainability.',
            'word_count': 1288
        },
        {
            'id': 'recDNArTEGqLo7u9n',
            'title': 'Mentor Credit - Business Case',
            'summary': 'The "Mentor Credit - Business Case" document outlines a transformative approach to knowledge sharing and mentoring that creates sustainable value through relational economics. It proposes a system where mentoring relationships are recognized and rewarded, fostering continuous learning and knowledge transfer across communities. The initiative aims to build a network of mentors and mentees that can drive innovation and social impact through collaborative knowledge exchange.',
            'word_count': 4528
        },
        {
            'id': 'recDSuzFz7t5qzvE0',
            'title': 'Systems Change Residency: - Business Case',
            'summary': 'The Systems Change Residency is an innovative program designed to support 130 visionary innovators in developing transformative solutions to global challenges. The initiative focuses on interdisciplinary collaboration and provides participants with resources, mentorship, and networks to scale their impact. It emphasizes the importance of systemic thinking and environmental solutions in creating lasting change.',
            'word_count': 4867
        },
        {
            'id': 'recG3twq8Kx2R2ypr',
            'title': 'IKSL - Business case',
            'summary': 'The Indigenous Knowledge Systems Labs (IKSL) initiative seeks to integrate Indigenous wisdom into contemporary approaches to sustainability and climate adaptation. It focuses on creating collaborative spaces where traditional knowledge can inform modern solutions to environmental challenges. The program emphasizes the importance of respecting and preserving Indigenous knowledge while leveraging it for broader societal benefit.',
            'word_count': 4754
        },
        {
            'id': 'recHPVRGxDee7hDSO',
            'title': 'Presidents - Business Case',
            'summary': 'The "Presidents - Business Case" document outlines a transformative program aimed at empowering young leaders to drive systemic change through custodial economies and climate action. It emphasizes the integration of Indigenous knowledge systems with contemporary leadership approaches to create sustainable development solutions. The initiative seeks to build a network of youth leaders who can implement innovative approaches to environmental and social challenges.',
            'word_count': 5164
        }
    ]
    
    logger.info(f"🎯 Fixing {len(documents_to_update)} documents")
    
    for doc in documents_to_update:
        try:
            updates = {
                'Summary': doc['summary'],
                'Word Count': doc['word_count'],
                'Language': 'English',
                'Status': 'Indexed'
            }
            
            table.update(doc['id'], updates)
            logger.info(f"✅ Updated {doc['title']}")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            logger.error(f"❌ Error updating {doc['title']}: {e}")
    
    logger.info("🎉 Completed fixing all documents!")

if __name__ == "__main__":
    fix_documents() 