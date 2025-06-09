#!/usr/bin/env python3
"""
Add sample text to test enhanced processing system.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def add_sample_text():
    """Add sample text to NATION Tour Video Transcript for testing."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    # Sample transcript text for testing
    sample_text = """
IMAGI-NATION Tour Video Transcript - Test Sample

Welcome to the IMAGI-NATION Tour, an incredible journey exploring creativity, innovation and imagination in education and community development.

Speaker 1: Today we're discussing the transformative power of imagination in addressing complex social challenges. The IMAGI-NATION concept represents a fundamental shift in how we approach problem-solving in our communities.

Speaker 2: That's absolutely right. What we've discovered through our research at AIME is that when young people are given the tools and space to imagine different futures, they become powerful agents of change in their own communities.

Speaker 1: The tour has taken us to schools, universities, and community centers across Australia, where we've witnessed firsthand the impact of mentoring programs that prioritize indigenous knowledge and storytelling.

Speaker 2: One of the key insights from this tour is that education isn't just about transferring information - it's about igniting imagination and helping people see possibilities they never knew existed.

The IMAGI-NATION approach involves:
- Connecting mentors with young people from underrepresented communities
- Using storytelling and creativity as learning tools
- Building bridges between indigenous and non-indigenous ways of knowing
- Creating spaces where imagination can flourish

Speaker 1: We've seen remarkable results in communities where this approach has been implemented. Students who were previously disengaged with traditional education models have found their voice and purpose.

Speaker 2: The ripple effects extend far beyond the classroom. When young people develop confidence in their ability to imagine and create change, they become leaders in their families and communities.

This transcript represents just a portion of the full IMAGI-NATION Tour discussion, which covers topics including education equity, community empowerment, and the role of imagination in social transformation.

[End of sample transcript]
"""

    # Find the NATION Tour Video Transcript document
    url = f'https://api.airtable.com/v0/{base_id}/Documents'
    headers = {'Authorization': f'Bearer {api_key}'}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    nation_doc = None
    for record in data.get('records', []):
        title = record['fields'].get('Title', '')
        if 'nation' in title.lower() and 'tour' in title.lower():
            nation_doc = record
            break
    
    if not nation_doc:
        print("❌ NATION Tour document not found")
        return False
    
    print(f"📄 Found document: {nation_doc['fields']['Title']}")
    print(f"🆔 ID: {nation_doc['id']}")
    
    # Update the document with sample text
    update_url = f"https://api.airtable.com/v0/{base_id}/Documents/{nation_doc['id']}"
    
    update_data = {
        "fields": {
            "Full Text": sample_text
        }
    }
    
    try:
        update_response = requests.patch(update_url, headers=headers, json=update_data)
        
        if update_response.status_code == 200:
            print("✅ Successfully added sample text!")
            print(f"📝 Text length: {len(sample_text):,} characters")
            print("🚀 Ready to test enhanced processing!")
            return True
        else:
            print(f"❌ Failed to update document: {update_response.status_code}")
            print(f"Response: {update_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating document: {e}")
        return False

if __name__ == "__main__":
    success = add_sample_text()
    if success:
        print("\n💡 Next steps:")
        print("1. Run: python full_enhanced_indexer.py")
        print("2. Check the enhanced metadata generation")
        print("3. Test RAG chat with the new content") 