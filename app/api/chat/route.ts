import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Citation {
  text: string
  source_url: string
  document_title: string
  chunk_id: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, model = 'openai', history = [], enable_intelligence = true, document_id, selectedThemes = [] } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Step 1: Generate embedding for the user query
    const embedding = await generateEmbedding(message)
    
    // Step 2: Search for relevant chunks in vector database (with theme filtering)
    console.log(`🔍 About to search for chunks with message: "${message}"`)
    if (selectedThemes.length > 0) {
      console.log(`🎯 Filtering by themes: ${selectedThemes.join(', ')}`)
    }
    const relevantChunks = await searchSimilarChunks(embedding, 5, message, document_id, selectedThemes)
    console.log(`📦 Retrieved ${relevantChunks.length} chunks from search`)
    
    // Step 3: HYBRID INTELLIGENCE - Enhance search with intelligence layer
    let intelligenceEnhancement = null
    if (enable_intelligence) {
      try {
        console.log('🧠 Applying intelligence enhancement...')
        intelligenceEnhancement = await enhanceWithIntelligence(message, relevantChunks)
      } catch (error) {
        console.warn('Intelligence enhancement failed, continuing without:', error)
      }
    }
    
    // Step 4: Generate response using LLM with context (and intelligence)
    const response = await generateResponse(message, relevantChunks, model, history, intelligenceEnhancement)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

async function enhanceWithIntelligence(message: string, chunks: any[]): Promise<any> {
  try {
    console.log('🧠 Applying direct intelligence enhancement...')
    
    // Direct intelligence enhancement (avoiding HTTP call)
    const queryConcepts = findQueryConcepts(message)
    const relatedConcepts = findRelatedConcepts(queryConcepts)
    const insights = generateRelevantInsights(queryConcepts)
    
    const intelligenceSummary = generateIntelligenceSummary(
      message, 
      queryConcepts, 
      relatedConcepts, 
      insights
    )

    const enhancement = {
      intelligence_summary: intelligenceSummary,
      related_concepts: relatedConcepts,
      insights,
      concept_connections: queryConcepts.length > 0
    }

    console.log('✅ Intelligence enhancement applied:', enhancement.intelligence_summary)
    return enhancement
    
  } catch (error) {
    console.error('Intelligence enhancement error:', error)
    return null
  }
}

// Helper functions for intelligence
function findQueryConcepts(query: string): string[] {
  const queryLower = query.toLowerCase()
  const concepts: string[] = []

  if (queryLower.includes('hoodie') || queryLower.includes('economics')) {
    concepts.push('Hoodie Economics')
  }
  if (queryLower.includes('relational')) {
    concepts.push('Community-Centered Economics')
  }
  if (queryLower.includes('indigenous') || queryLower.includes('cultural')) {
    concepts.push('Indigenous Knowledge Integration')
  }
  if (queryLower.includes('digital') || queryLower.includes('recognition')) {
    concepts.push('Digital Hoodies Recognition System')
  }
  if (queryLower.includes('business') || queryLower.includes('cases')) {
    concepts.push('Relational Value Metrics')
  }
  if (queryLower.includes('scale') || queryLower.includes('impact')) {
    concepts.push('Scaling Impact Models')
  }

  return concepts
}

function findRelatedConcepts(queryConcepts: string[]): string[] {
  const related: string[] = []

  queryConcepts.forEach(concept => {
    switch (concept) {
      case 'Hoodie Economics':
        related.push('Community-Centered Economics', 'Relational Leadership')
        break
      case 'Indigenous Knowledge Integration':
        related.push('Cultural Sensitivity Framework', 'Community Consultation')
        break
      case 'Digital Hoodies Recognition System':
        related.push('Relational Value Metrics', 'Impact Assessment')
        break
      case 'Community-Centered Economics':
        related.push('Social Innovation', 'Collective Value Creation')
        break
      case 'Scaling Impact Models':
        related.push('Community Replication', 'Network Effects')
        break
    }
  })

  return Array.from(new Set(related)).filter(concept => !queryConcepts.includes(concept))
}

function generateRelevantInsights(queryConcepts: string[]) {
  const insights = []

  if (queryConcepts.some(c => c.includes('Economics') || c.includes('Relational'))) {
    insights.push({
      title: 'Cross-Domain Innovation Pattern',
      description: 'Relational economics concepts show strong connections to indigenous systems thinking, creating unique innovation opportunities',
      confidence: 0.85
    })
  }

  if (queryConcepts.some(c => c.includes('Indigenous') || c.includes('Cultural'))) {
    insights.push({
      title: 'Cultural Integration Bridge',
      description: 'Indigenous knowledge systems provide foundational frameworks that enhance contemporary methodologies',
      confidence: 0.9
    })
  }

  if (queryConcepts.some(c => c.includes('Digital') || c.includes('Recognition'))) {
    insights.push({
      title: 'Recognition System Evolution', 
      description: 'Digital recognition systems are evolving beyond traditional metrics to capture relational value',
      confidence: 0.8
    })
  }

  return insights
}

function generateIntelligenceSummary(
  query: string, 
  queryConcepts: string[], 
  relatedConcepts: string[], 
  insights: any[]
): string {
  const parts: string[] = []

  if (queryConcepts.length > 0) {
    parts.push(`Your query connects to ${queryConcepts.length} key concept${queryConcepts.length > 1 ? 's' : ''}: ${queryConcepts.join(', ')}`)
  }

  if (relatedConcepts.length > 0) {
    parts.push(`Related concepts to explore: ${relatedConcepts.slice(0, 3).join(', ')}`)
  }

  if (insights.length > 0) {
    parts.push(`Key insight: ${insights[0].description}`)
  }

  if (parts.length === 0) {
    return 'This query shows potential for deeper concept exploration as the knowledge base expands.'
  }

  return parts.join('. ')
}

async function searchSimilarChunks(embedding: number[], limit: number = 5, query?: string, documentId?: string, selectedThemes: string[] = []) {
  try {
    console.log(`🔍 SEARCH FUNCTION CALLED with query: "${query}"${documentId ? ` for document: ${documentId}` : ''}`)
    
    // DOCUMENT-SPECIFIC OR MULTI-DOCUMENT SEARCH
    const allResults = []
    
    if (documentId) {
      // DOCUMENT-SPECIFIC SEARCH
      console.log(`🎯 Document-specific search for: ${documentId}`)
      
      // Get all chunks from the specific document and rank them by vector similarity
      const { data: docChunks, error: docError } = await supabase
        .from('document_chunks')
        .select('chunk_id, document_id, document_title, chunk_index, content')
        .eq('document_id', documentId)
        .order('chunk_index')
      
      if (docError) {
        console.error('❌ Document-specific search error:', docError)
        return []
      }
      
      console.log(`📄 Found ${docChunks?.length || 0} chunks in document`)
      
      // If we have chunks, calculate their similarity scores manually
      if (docChunks && docChunks.length > 0) {
        // For document-specific search, we'll use all chunks but still respect the limit
        allResults.push(...docChunks.slice(0, limit))
      }
      
    } else {
      // MULTI-DOCUMENT SEARCH with optional theme filtering
      if (selectedThemes.length > 0) {
        // THEME-FILTERED SEARCH using Airtable document data
        console.log(`🎯 Theme-filtered search for: ${selectedThemes.join(', ')}`)
        
        try {
          // Fetch documents from Airtable to get theme information
          const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
          const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
          
          if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
            // Fetch documents and themes from Airtable
            const [documentsResponse, themesResponse] = await Promise.all([
              fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Documents`, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
              }),
              fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Themes`, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
              })
            ])
            
            if (documentsResponse.ok && themesResponse.ok) {
              const documentsData = await documentsResponse.json()
              const themesData = await themesResponse.json()
              
              // Create theme ID to name mapping
              const themeMap = Object.fromEntries(
                themesData.records.map((theme: any) => [theme.id, theme.fields.Name])
              )
              
              // Find documents that match selected themes
              const matchingDocuments = documentsData.records.filter((doc: any) => {
                const docThemeIds = doc.fields.Themes || []
                const docThemeNames = docThemeIds.map((id: string) => themeMap[id]).filter(Boolean)
                return selectedThemes.some(selectedTheme => docThemeNames.includes(selectedTheme))
              })
              
              console.log(`📄 Found ${matchingDocuments.length} documents matching themes:`, 
                matchingDocuments.map((doc: any) => doc.fields.Title).join(', '))
              
              if (matchingDocuments.length > 0) {
                const matchingDocumentIds = matchingDocuments.map((doc: any) => doc.id)
                
                // Get chunks from matching documents
                const { data: themeChunks, error: themeError } = await supabase
                  .from('document_chunks')
                  .select('chunk_id, document_id, document_title, chunk_index, content')
                  .in('document_id', matchingDocumentIds)
                  .limit(15)
                
                if (!themeError && themeChunks) {
                  console.log(`🎯 Found ${themeChunks.length} chunks from theme-filtered documents`)
                  
                  const themedResults = themeChunks.map((chunk: any) => ({
                    ...chunk,
                    similarity: 0.8, // High similarity for theme matches
                    match_type: 'theme_filtered'
                  }))
                  
                  allResults.push(...themedResults)
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in theme filtering:', error)
          // Fall back to regular search if theme filtering fails
        }
      } else {
        // REGULAR VECTOR SEARCH (existing logic)
      const { data: vectorData, error: vectorError } = await supabase.rpc('match_chunks', {
        query_embedding: embedding,
        match_threshold: 0.0,
        match_count: 15, // Get more results initially
      })

      if (vectorError) {
        console.error('❌ Vector search error:', vectorError)
      } else if (vectorData) {
        console.log(`🧠 Vector search found ${vectorData.length} chunks`)
        allResults.push(...vectorData)
        }
      }

      // 2. Add specific document matches (but limit them)
      if (query && query.toLowerCase().includes('hoodie') && query.toLowerCase().includes('economics')) {
        console.log(`🎯 Adding Hoodie Economics content`)
        
        const { data: hoodieData, error: hoodieError } = await supabase
          .from('document_chunks')
          .select('chunk_id, document_id, document_title, chunk_index, content')
          .eq('document_title', 'Hoodie Economics')
          .limit(2) // Reduced from 3 to 2

        if (!hoodieError && hoodieData) {
          console.log(`✅ Found ${hoodieData.length} chunks from Hoodie Economics`)
          const hoodieResults = hoodieData.map((chunk: any) => ({
            ...chunk,
            similarity: 0.95, // High but not overwhelming
            match_type: 'direct_match'
          }))
          allResults.push(...hoodieResults)
        }
      }

      // 3. Fallback: ensure we have SOMETHING
      if (allResults.length === 0) {
        console.log(`🚨 No results found, getting fallback content`)
        
        const { data: fallbackData } = await supabase
          .from('document_chunks')
          .select('chunk_id, document_id, document_title, chunk_index, content')
          .limit(5)

        if (fallbackData) {
          allResults.push(...fallbackData)
        }
      }
    }

    console.log(`📊 Total search results before dedup: ${allResults.length}`)

    // 4. Smart deduplication and document diversity
    const uniqueResults = []
    const seenChunks = new Set()
    const documentCounts = new Map()
    const maxPerDocument = 2 // Maximum chunks per document
    
    // Sort by similarity (if available) to prioritize best matches
    allResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    
    for (const chunk of allResults) {
      if (!seenChunks.has(chunk.chunk_id)) {
        const docTitle = chunk.document_title
        const currentCount = documentCounts.get(docTitle) || 0
        
        // Add if we haven't exceeded the per-document limit
        if (currentCount < maxPerDocument) {
          uniqueResults.push(chunk)
          seenChunks.add(chunk.chunk_id)
          documentCounts.set(docTitle, currentCount + 1)
          
          // Stop if we have enough results
          if (uniqueResults.length >= limit) {
            break
          }
        }
      }
    }

    // Log document diversity
    const documentBreakdown = Array.from(documentCounts.entries())
      .map(([doc, count]) => `${doc}: ${count}`)
      .join(', ')
    console.log(`📚 Document diversity: ${documentBreakdown}`)
    
    console.log(`✅ Returning ${uniqueResults.length} diverse results`)
    
    return uniqueResults
    
  } catch (error) {
    console.error('🚨 Error in search function:', error)
    return []
  }
}

async function extractFactsFromResponse(response: string, query: string, chunks: any[]) {
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
          // Clean up the match
          const cleanMatch = match.trim().replace(/^[^\w]*|[^\w]*$/g, '')
          if (cleanMatch.length > 10 && cleanMatch.length < 200) {
            facts.push({
              content: cleanMatch,
              confidence: 0.8,
              source_context: `Statistical information from: "${query}"`,
              suggested_tags: extractTagsFromContent(cleanMatch, query)
            })
          }
        })
      }
    }
    
    // Look for definitive statements about AIME/IMAGI-NATION
    const aimePatterns = [
      /(AIME [^.]{20,150})/gi,
      /(IMAGI-NATION [^.]{20,150})/gi
    ]
    
    for (const pattern of aimePatterns) {
      const matches = response.match(pattern)
      if (matches) {
        console.log('🎯 Found AIME-related matches:', matches)
        matches.forEach(match => {
          const cleanMatch = match.trim()
          if (cleanMatch.length > 20 && cleanMatch.length < 200) {
            facts.push({
              content: cleanMatch,
              confidence: 0.7,
              source_context: `AIME program information from: "${query}"`,
              suggested_tags: extractTagsFromContent(cleanMatch, query)
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
              suggested_tags: extractTagsFromContent(cleanMatch, query)
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
          suggested_tags: extractTagsFromContent(cleanSentence, query)
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

function extractTagsFromContent(content: string, query: string) {
  const tags = []
  
  // Add query-based tags
  if (query.toLowerCase().includes('impact')) tags.push('impact')
  if (query.toLowerCase().includes('education')) tags.push('education')
  if (query.toLowerCase().includes('university')) tags.push('university')
  if (query.toLowerCase().includes('student')) tags.push('students')
  
  // Add content-based tags
  if (content.toLowerCase().includes('university')) tags.push('university')
  if (content.toLowerCase().includes('student')) tags.push('students')
  if (content.toLowerCase().includes('program')) tags.push('programs')
  if (content.toLowerCase().includes('completion')) tags.push('completion-rates')
  if (content.toLowerCase().includes('million')) tags.push('scale')
  if (content.toLowerCase().includes('%')) tags.push('statistics')
  if (content.toLowerCase().includes('indigenous')) tags.push('indigenous')
  if (content.toLowerCase().includes('mentor')) tags.push('mentoring')
  
  return [...new Set(tags)].slice(0, 4) // Remove duplicates and limit
}

async function generateResponse(
  query: string,
  chunks: any[],
  model: string,
  history: ChatMessage[],
  intelligenceEnhancement?: any
) {
  const context = chunks
    .map(chunk => `Document: ${chunk.document_title}\nContent: ${chunk.content}`)
    .join('\n\n')

  // Build enhanced system prompt with intelligence
  let systemPrompt = `You are an AI assistant for the AIME Knowledge Hub. You help users find information from research documents and answer questions based on the knowledge base.

Context from relevant documents:
${context}`

  // Add intelligence enhancement if available
  if (intelligenceEnhancement) {
    systemPrompt += `

🧠 INTELLIGENCE ENHANCEMENT:
${intelligenceEnhancement.intelligence_summary}

Related concepts to consider: ${intelligenceEnhancement.related_concepts.join(', ')}

Key insights: ${intelligenceEnhancement.insights.map((insight: any) => insight.description).join('; ')}`
  }

  systemPrompt += `

Instructions:
1. Answer the user's question based on the provided context
2. If intelligence enhancement is provided, incorporate those insights naturally
3. If the context doesn't contain enough information, say so clearly
4. Always cite your sources by referencing the document titles
5. Be concise but comprehensive
6. Use a professional but friendly tone
7. If related concepts are suggested, mention them as "You might also be interested in exploring..."

If no relevant context is provided, explain that you don't have specific information about that topic in the current knowledge base.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4), // Include recent history for context
    { role: 'user', content: query },
  ]

  try {
    let content = ''
    
    if (model === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const anthropicMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ 
          role: m.role as 'user' | 'assistant', 
          content: String(m.content) 
        })) // Ensure only required properties with correct types
      
          const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: anthropicMessages as any,
        system: systemPrompt,
      })
      
      content = response.content[0].type === 'text' ? response.content[0].text : ''
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
      })
      
      content = response.choices[0]?.message?.content || ''
    }

    // Generate citations from the chunks used
    const citations: Citation[] = chunks.map(chunk => ({
      text: chunk.content,
      source_url: `/documents/${chunk.document_id}`,
      document_title: chunk.document_title,
      chunk_id: chunk.chunk_id,
    }))

    // Extract facts from the response
    const extractable_facts = await extractFactsFromResponse(content, query, chunks)

    return {
      content,
      citations,
      extractable_facts,
      model_used: model,
      intelligence_enhancement: intelligenceEnhancement,
    }
  } catch (error) {
    console.error('Error generating response:', error)
    throw new Error('Failed to generate response')
  }
} 