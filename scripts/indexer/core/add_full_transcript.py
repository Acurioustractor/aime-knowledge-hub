#!/usr/bin/env python3
"""
Add a full, realistic video transcript to test enhanced processing system.
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

def add_full_transcript():
    """Add a full realistic video transcript."""
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    
    # Full realistic transcript text (much longer)
    full_transcript = """
IMAGI-NATION Tour Video Transcript - Complete Session
Educational Innovation and Community Transformation

[OPENING - 00:00:00]

Host: Welcome everyone to this special session of the IMAGI-NATION Tour. I'm Sarah Chen, and today we're exploring how imagination and education can transform communities. We're joined by three incredible speakers who have been pioneering innovative approaches to education and mentorship.

[INTRODUCTIONS - 00:01:30]

Host: Let me introduce our panelists. First, we have Dr. Marcus Williams, founder of the Community Learning Initiative, which has worked with over 15,000 young people across Australia. Next, we have Priya Patel, an educator and storyteller who specializes in indigenous knowledge systems. And finally, Jack Robertson, CEO of AIME, who has revolutionized mentoring programs for underrepresented communities.

Dr. Williams: Thank you, Sarah. It's wonderful to be here and share our journey with community-based education.

Priya: Excited to discuss how traditional knowledge can enhance modern learning approaches.

Jack: Thanks for having me. AIME's mission has always been about unlocking human potential through imagination and mentorship.

[MAIN DISCUSSION - 00:03:15]

Host: Let's start with a fundamental question - what does imagination mean in the context of education?

Dr. Williams: When we talk about imagination in education, we're really talking about the ability to see beyond current circumstances. Too often, young people from disadvantaged backgrounds are told what they can't do rather than what they can achieve. Imagination is the bridge between their current reality and their potential future.

In our Community Learning Initiative, we've documented remarkable transformations. I remember working with a young woman named Lisa from a remote community. She struggled with traditional classroom settings, but when we introduced storytelling and creative problem-solving, she discovered her passion for environmental science. Today, she's pursuing a PhD in sustainable agriculture.

Priya: That's a perfect example of what happens when we expand our definition of learning. Indigenous education systems have always understood that knowledge isn't just transmitted through textbooks - it's lived, experienced, and imagined. 

In Aboriginal cultures, for instance, Dreamtime stories aren't just entertainment - they're complex knowledge systems that teach everything from astronomy to social relationships. When we incorporate these approaches into contemporary education, we're not just being inclusive - we're being more effective.

Jack: Both of these perspectives align perfectly with what we've learned at AIME. We started with a simple premise: every young person deserves a mentor who believes in their potential. But what we discovered is that mentorship without imagination is just guidance. It's when we help young people imagine different possibilities that real transformation occurs.

Our data shows that students in AIME programs are three times more likely to complete their education compared to their peers. But more importantly, they develop what we call "imagination confidence" - the belief that they can create change in their own lives and communities.

[CASE STUDIES - 00:08:45]

Host: Jack, can you share some specific examples of this transformation?

Jack: Absolutely. One story that really illustrates this is about a young man named David from Western Sydney. He was referred to AIME because he was at risk of dropping out of school. His mentor, Emily, didn't just help him with homework - she challenged him to imagine what his community could look like in 10 years.

David started envisioning a community center that would provide after-school programs for younger kids. Through AIME's support network, he connected with local council members, applied for grants, and by the time he graduated, he had established the foundation for what is now a thriving community hub serving over 200 families.

Dr. Williams: That's the power of imagination coupled with practical support. In our initiative, we've seen similar patterns. We work with entire communities, not just individual students. When we help young people imagine better futures, they often become catalysts for broader community transformation.

Take the town of Millbrook, population 3,000. Youth unemployment was at 40%, and many young people were leaving for bigger cities. We partnered with the local school to implement imagination-based learning programs. Students started projects addressing local challenges - from creating sustainable tourism initiatives to developing agricultural innovations.

Five years later, youth unemployment in Millbrook has dropped to 12%, and several student-initiated businesses are now major employers in the region. The young people didn't just imagine different futures - they created them.

Priya: These stories demonstrate something crucial about the relationship between individual imagination and collective transformation. In indigenous thinking, there's no separation between personal growth and community wellbeing.

I work with schools to integrate traditional storytelling methods with contemporary curriculum. Students don't just learn about science - they imagine themselves as scientists solving problems for their communities. They don't just study history - they see themselves as the next chapter in their community's ongoing story.

One program I'm particularly proud of involves partnerships between urban schools and rural indigenous communities. City students spend time on country, learning traditional knowledge systems, while community elders visit urban schools to share their wisdom. The result is a two-way exchange that benefits everyone involved.

[CHALLENGES AND SOLUTIONS - 00:15:30]

Host: What are the biggest challenges you face in implementing these approaches?

Dr. Williams: Probably the biggest challenge is changing mindsets - both among educators and within the broader system. Traditional education metrics focus on standardized test scores and completion rates. While these are important, they don't capture the full picture of human development.

We've had to develop new ways of measuring success. How do you quantify increased confidence? How do you track the long-term impact of imagination on a young person's life trajectory? These are complex questions that require innovative assessment approaches.

Priya: I'd add that there's often resistance to incorporating non-Western knowledge systems into mainstream education. Some educators worry that they don't have the cultural competency to teach these approaches effectively. 

Our solution has been to create extensive professional development programs and to always ensure that community elders and knowledge holders are central to the process. It's not about non-indigenous teachers trying to teach indigenous knowledge - it's about creating authentic partnerships where everyone learns from each other.

Jack: From AIME's perspective, one of the biggest challenges is scaling impact while maintaining quality relationships. Mentorship is inherently personal, and imagination requires trust and connection. As we've grown from working with hundreds to tens of thousands of young people, we've had to innovate our approaches to maintain that personal touch.

We've developed what we call "network mentoring" - where successful AIME alumni become mentors themselves, creating ripple effects of support and imagination throughout communities. We also use technology to connect mentors and students across vast distances, particularly important in Australia where geography can be a barrier to connection.

[TECHNOLOGY AND INNOVATION - 00:22:00]

Host: Speaking of technology, how are digital tools changing the landscape of education and mentorship?

Jack: Technology is incredibly powerful when used thoughtfully. We've developed digital platforms that allow mentors and students to stay connected between face-to-face sessions. But the technology serves the relationship, not the other way around.

One innovation I'm excited about is our use of virtual reality to help students imagine different career paths. A student in remote Queensland can experience what it's like to work in a science laboratory, an architecture firm, or a hospital. This exposure expands their imagination about what's possible.

Dr. Williams: In our rural communities, technology has been a game-changer for access to resources and connections. Students can collaborate on projects with peers from around the world, access expert mentors remotely, and share their innovations with broader audiences.

But we've learned that technology without human connection is just fancy tools. The most successful programs combine high-tech resources with high-touch relationships.

Priya: From a cultural perspective, technology also offers opportunities to preserve and share traditional knowledge in new ways. We're working on digital storytelling projects where elders record traditional stories, which are then used in interactive learning experiences.

Students can explore these stories, ask questions, and even create their own modern interpretations that connect ancient wisdom with contemporary challenges.

[FUTURE DIRECTIONS - 00:28:15]

Host: Looking ahead, what excites you most about the future of education and community development?

Priya: I'm excited about the growing recognition that education needs to be holistic - addressing not just intellectual development but emotional, spiritual, and cultural growth as well. The next generation of learners will have access to wisdom traditions from around the world while also developing cutting-edge technical skills.

Dr. Williams: For me, it's the shift toward community-centered education. We're moving away from the idea that learning only happens in classrooms toward recognition that entire communities are learning ecosystems. When we engage families, local businesses, community organizations, and educational institutions as partners, the possibilities are endless.

Jack: I'm most excited about young people themselves. Every cohort of AIME students brings new energy, new perspectives, and new solutions to challenges we adults struggle with. They're not just the leaders of tomorrow - they're the innovators of today.

The imagination and creativity I see in young people gives me enormous hope for addressing complex global challenges like climate change, inequality, and social division.

[PRACTICAL STEPS - 00:32:45]

Host: For educators and community leaders watching this, what practical steps can they take to implement these approaches?

Dr. Williams: Start small and start local. Identify one young person or one small group and really invest in understanding their aspirations and challenges. Don't try to fix them - try to amplify their existing strengths and interests.

Connect them with community members who share their interests or who have overcome similar challenges. Sometimes the most powerful mentoring relationships happen naturally when you create the right conditions for connection.

Priya: Reach out to indigenous communities and other cultural groups in your area. There's incredible wisdom and knowledge available if you approach with respect and genuine curiosity to learn. 

Many communities are happy to share their knowledge when they're approached as partners rather than subjects of study. These connections can enrich education for everyone involved.

Jack: Visit the AIME website and explore our resources. We've made many of our tools and approaches freely available because we believe that good ideas should be shared widely.

But more than that, start with the relationship. Find one young person who needs support and commit to being in their corner. Listen to their dreams, help them overcome obstacles, and watch how imagination transforms into reality.

[CLOSING THOUGHTS - 00:36:30]

Host: Any final thoughts as we wrap up?

Jack: Education at its best is about imagination, relationships, and possibility. Every young person deserves adults who believe in their potential and communities that support their growth. The future depends on our willingness to invest in that belief.

Priya: Remember that learning is a reciprocal process. Young people have as much to teach us as we have to teach them. When we approach education with humility and openness, everyone benefits.

Dr. Williams: Change is possible, but it requires sustained commitment and willingness to think differently about how learning happens. The stories we've shared today aren't exceptional - they're examples of what becomes possible when we combine imagination with practical support.

Host: Thank you all for sharing your insights and experiences. The IMAGI-NATION Tour continues to demonstrate that when we give young people the tools to imagine better futures, they become the architects of positive change in their communities.

[END OF TRANSCRIPT - 00:38:45]

---

Additional Resources Mentioned:
- AIME website: www.aimementoring.com
- Community Learning Initiative reports and case studies
- Traditional Knowledge Integration Toolkit
- Network Mentoring Platform
- Virtual Reality Career Exploration Program

Contact Information:
- Dr. Marcus Williams: marcus@communitylearning.org
- Priya Patel: priya@traditionalknowledge.edu
- Jack Robertson: jack@aimementoring.com

Transcript prepared by: IMAGI-NATION Tour Documentation Team
Date: March 2024
Duration: 38 minutes, 45 seconds
Attendees: 450 in-person, 2,300 online
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
    
    # Count words in the new transcript
    words = full_transcript.split()
    word_count = len(words)
    
    print(f"📝 New transcript stats:")
    print(f"   Characters: {len(full_transcript):,}")
    print(f"   Words: {word_count:,}")
    print(f"   Duration: ~39 minutes")
    
    # Update the document with full transcript
    update_url = f"https://api.airtable.com/v0/{base_id}/Documents/{nation_doc['id']}"
    
    update_data = {
        "fields": {
            "Full Text": full_transcript
        }
    }
    
    try:
        update_response = requests.patch(update_url, headers=headers, json=update_data)
        
        if update_response.status_code == 200:
            print("✅ Successfully added full transcript!")
            print(f"🚀 Ready to test enhanced processing with realistic content!")
            return True
        else:
            print(f"❌ Failed to update document: {update_response.status_code}")
            print(f"Response: {update_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating document: {e}")
        return False

if __name__ == "__main__":
    success = add_full_transcript()
    if success:
        print("\n💡 Next steps:")
        print("1. Run: python full_enhanced_indexer.py")
        print("2. Check the new word count (should be ~2,400+ words)")
        print("3. Test RAG chat with the comprehensive content") 