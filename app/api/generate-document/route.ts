import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface DocumentRequest {
  type: 'pitch_deck' | 'proposal' | 'report' | 'website_content'
  audience: string
  focus_themes: string[]
  purpose: string
  length: 'short' | 'medium' | 'long'
  tone: 'professional' | 'inspirational' | 'academic' | 'conversational'
}

export async function POST(request: NextRequest) {
  try {
    const body: DocumentRequest = await request.json()
    const { type, audience, focus_themes, purpose, length, tone } = body

    // Fetch relevant themes and documents
    const themesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/themes`)
    const themesData = await themesResponse.json()
    
    const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents`)
    const documentsData = await documentsResponse.json()

    // Handle different response formats
    const allThemes = Array.isArray(themesData) ? themesData : (themesData.themes || [])
    const allDocuments = Array.isArray(documentsData) ? documentsData : (documentsData.documents || [])

    console.log('Generate Document API - Themes data type:', typeof themesData, 'Array?', Array.isArray(themesData))
    console.log('Generate Document API - Documents data type:', typeof documentsData, 'Array?', Array.isArray(documentsData))
    console.log('Generate Document API - Final themes count:', allThemes.length)
    console.log('Generate Document API - Final documents count:', allDocuments.length)

    // Filter themes and get relevant content
    const relevantThemes = allThemes.filter((theme: any) => 
      focus_themes.some(focusTheme => 
        theme.name.toLowerCase().includes(focusTheme.toLowerCase()) ||
        focusTheme.toLowerCase().includes(theme.name.toLowerCase())
      )
    )

    // Get supporting documents based on themes
    const supportingDocs = allDocuments.filter((doc: any) =>
      doc.themes?.some((docTheme: string) =>
        focus_themes.some(focusTheme => 
          docTheme.toLowerCase().includes(focusTheme.toLowerCase())
        )
      )
    ).slice(0, 5) // Top 5 most relevant

    // Create content context
    const themeContext = relevantThemes.map((theme: any) => 
      `${theme.name}: ${theme.count} documents`
    ).join('\n')

    const docContext = supportingDocs.map((doc: any) => 
      `"${doc.title}": ${doc.description || doc.summary || 'Key AIME document'}`
    ).join('\n')

    // Generate document structure and content
    const prompt = createDocumentPrompt(type, audience, purpose, length, tone, themeContext, docContext, relevantThemes)

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: getTokenLimit(length),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const generatedContent = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse the response into structured format
    const structuredDocument = parseDocumentResponse(generatedContent, type)

    return NextResponse.json({
      success: true,
      document: structuredDocument,
      metadata: {
        type,
        audience,
        themes_used: relevantThemes.length,
        sources_referenced: supportingDocs.length,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Document generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate document' },
      { status: 500 }
    )
  }
}

function createDocumentPrompt(
  type: string, 
  audience: string, 
  purpose: string, 
  length: string, 
  tone: string, 
  themeContext: string, 
  docContext: string,
  themes: any[]
): string {
  const basePrompt = `
You are an expert content strategist working with AIME (Australian Indigenous Mentoring Experience), a global organization focused on Indigenous knowledge systems, mentorship, and systemic change.

TASK: Generate a ${type.replace('_', ' ')} for the following:
- AUDIENCE: ${audience}
- PURPOSE: ${purpose}  
- LENGTH: ${length}
- TONE: ${tone}

AVAILABLE AIME THEMES (with document counts):
${themeContext}

SUPPORTING AIME DOCUMENTS:
${docContext}

AIME CORE CONCEPTS TO INTEGRATE:
- Hoodie Economics (relational economics model)
- Indigenous Knowledge Systems
- Mentorship Networks
- Joy Corporation philosophy
- Systemic Change approaches
- Community-Centered Impact
`

  switch (type) {
    case 'pitch_deck':
      return basePrompt + `
Create a compelling pitch deck with the following structure:
1. Executive Summary
2. The Problem/Opportunity
3. AIME's Solution
4. Impact Evidence
5. Business Model
6. Market Opportunity
7. Team & Approach
8. Financial Projections/Needs
9. Call to Action

For each slide, provide:
- Slide Title
- Key Points (3-5 bullet points)
- Supporting Data/Evidence from AIME documents
- Recommended Visual/Chart description

Focus on storytelling that connects AIME's unique approach to measurable impact.
`
    
    case 'proposal':
      return basePrompt + `
Create a detailed project proposal with:
1. Executive Summary
2. Project Description & Objectives
3. Methodology & Approach
4. Expected Outcomes & Impact
5. Timeline & Milestones
6. Budget & Resources
7. Evaluation Framework
8. Sustainability Plan
9. Appendices (key supporting data)

Include specific references to AIME's proven methodologies and impact data.
`

    case 'report':
      return basePrompt + `
Create a comprehensive report with:
1. Executive Summary
2. Introduction & Context
3. Key Findings
4. Analysis & Insights
5. Recommendations
6. Implementation Framework
7. Conclusion
8. References & Appendices

Use AIME's data and themes to support all findings and recommendations.
`

    default:
      return basePrompt + `
Create structured content that effectively communicates AIME's value proposition and impact.
`
  }
}

function getTokenLimit(length: string): number {
  switch (length) {
    case 'short': return 2000
    case 'medium': return 4000
    case 'long': return 8000
    default: return 4000
  }
}

function parseDocumentResponse(content: string, type: string) {
  // Split content into sections and structure it
  const sections = content.split(/(?=^#|\n(?=\d+\.))/m).filter(section => section.trim())
  
  return {
    type,
    title: extractTitle(content),
    sections: sections.map((section, index) => ({
      id: index + 1,
      title: extractSectionTitle(section),
      content: section.trim(),
      order: index + 1
    })),
    word_count: content.split(' ').length,
    generated_at: new Date().toISOString()
  }
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s*(.+)$/m)
  return titleMatch ? titleMatch[1] : 'Generated AIME Document'
}

function extractSectionTitle(section: string): string {
  const titleMatch = section.match(/^(?:#\s*|(?:\d+\.)\s*)(.+)$/m)
  return titleMatch ? titleMatch[1].trim() : 'Section'
} 