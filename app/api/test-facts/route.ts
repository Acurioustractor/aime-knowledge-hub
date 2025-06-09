import { NextRequest, NextResponse } from 'next/server'

// Test the fact extraction function directly
async function extractFactsFromResponse(response: string, query: string) {
  try {
    console.log('🔍 Starting fact extraction from response:', response.substring(0, 100) + '...')
    
    // Simple fact extraction using patterns and keywords
    const facts = []
    
    // Look for statistical claims
    const statPatterns = [
      /(\d+(?:\.\d+)?%[^.]*)/g,
      /(\d+(?:,\d{3})*(?:\.\d+)?\s+(?:students?|people|participants?|universities?|programs?)[^.]*)/gi,
      /(over \d+[^.]*)/gi,
      /(more than \d+[^.]*)/gi,
      /(up to \d+[^.]*)/gi
    ]
    
    for (const pattern of statPatterns) {
      const matches = response.match(pattern)
      if (matches) {
        console.log('📊 Found statistical matches:', matches)
        matches.forEach(match => {
          const cleanMatch = match.trim().replace(/^[^\w]*|[^\w]*$/g, '')
          if (cleanMatch.length > 10 && cleanMatch.length < 200) {
            facts.push({
              content: cleanMatch,
              confidence: 0.8,
              source_context: `Statistical information from: "${query}"`,
              suggested_tags: ['statistics']
            })
          }
        })
      }
    }
    
    // Look for key conceptual definitions and explanations
    const conceptPatterns = [
      /(visa[^.]*(?:membership|participation|role|way to)[^.]*)/gi,
      /(mentor[^.]*(?:matching|program|system)[^.]*)/gi,
      /(appears to be[^.]{20,150})/gi,
      /(represents[^.]{20,150})/gi,
      /(in order to[^.]{20,150})/gi
    ]
    
    for (const pattern of conceptPatterns) {
      const matches = response.match(pattern)
      if (matches) {
        console.log('💡 Found conceptual matches:', matches)
        matches.forEach(match => {
          const cleanMatch = match.trim()
          if (cleanMatch.length > 25 && cleanMatch.length < 200) {
            facts.push({
              content: cleanMatch,
              confidence: 0.6,
              source_context: `Concept definition from: "${query}"`,
              suggested_tags: ['concept', 'definition']
            })
          }
        })
      }
    }
    
    // Look for complete sentences that contain key terms
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 30)
    sentences.forEach(sentence => {
      const keyTerms = ['visa', 'aime', 'imagi-nation', 'mentor', 'program', 'system', 'movement', 'participation']
      const hasKeyTerm = keyTerms.some(term => sentence.toLowerCase().includes(term))
      const hasDefinition = /(?:is|are|seems to be|appears to be|represents|means)/i.test(sentence)
      
      if (hasKeyTerm && hasDefinition && sentence.trim().length > 30 && sentence.trim().length < 200) {
        const cleanSentence = sentence.trim()
        console.log('🔑 Found key definition sentence:', cleanSentence)
        facts.push({
          content: cleanSentence,
          confidence: 0.6,
          source_context: `Definition from: "${query}"`,
          suggested_tags: ['definition', 'key-concept']
        })
      }
    })
    
    // Remove duplicates and limit to top 3 facts
    const uniqueFacts = facts.filter((fact, index, self) => 
      index === self.findIndex(f => f.content === fact.content)
    ).slice(0, 3)
    
    console.log('✨ Extracted facts:', uniqueFacts)
    
    return uniqueFacts
  } catch (error) {
    console.error('Error extracting facts:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, query } = await request.json()
    
    const extractedFacts = await extractFactsFromResponse(text, query || 'test query')
    
    return NextResponse.json({ 
      success: true, 
      facts: extractedFacts,
      count: extractedFacts.length 
    })
  } catch (error) {
    console.error('Error in test-facts:', error)
    return NextResponse.json({ error: 'Failed to extract facts' }, { status: 500 })
  }
}

export async function GET() {
  // Test with the visa response you got
  const testResponse = `In the context of the documents you're referring to, a "visa" seems to be a sort of membership or participation in the activities of AIME. It's not a travel document as in the traditional sense. It appears to be a way to join the movement towards a nature-centered world. Terms like the "Mentor Matchmaking Visa" and the "Kind Visa" are mentioned, which might represent different roles or ways to contribute. The number of these visas appears to be limited in order to foster genuine connections and prevent overwhelming the system.`
  
  const extractedFacts = await extractFactsFromResponse(testResponse, 'what is a visa?')
  
  return NextResponse.json({ 
    success: true, 
    test_response: testResponse,
    facts: extractedFacts,
    count: extractedFacts.length,
    message: 'This is a test of the fact extraction system. POST to this endpoint with {text, query} to test other content.'
  })
} 