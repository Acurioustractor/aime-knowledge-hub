import { NextRequest, NextResponse } from 'next/server'

// For now, we'll store in memory/localStorage simulation
// In Phase 2, this will connect to your database
let validationSnippets: any[] = []

export async function GET(request: NextRequest) {
  try {
    // Remove duplicates based on content (clean up existing data)
    const uniqueSnippets = validationSnippets.filter((snippet, index, array) => 
      array.findIndex(s => s.content.trim().toLowerCase() === snippet.content.trim().toLowerCase()) === index
    )
    
    // Update the array if duplicates were found
    if (uniqueSnippets.length !== validationSnippets.length) {
      console.log(`🧹 Removed ${validationSnippets.length - uniqueSnippets.length} duplicate snippets`)
      validationSnippets = uniqueSnippets
    }
    
    // Return all validation snippets
    return NextResponse.json({ 
      snippets: validationSnippets,
      count: validationSnippets.length 
    })
  } catch (error) {
    console.error('Error fetching validation snippets:', error)
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check for duplicate content to prevent duplicates
    const existingSnippet = validationSnippets.find(snippet => 
      snippet.content.trim().toLowerCase() === body.content.trim().toLowerCase()
    )
    
    if (existingSnippet) {
      console.log(`⚠️ Duplicate snippet detected, returning existing:`, body.content.substring(0, 50) + '...')
      return NextResponse.json({ 
        success: true, 
        snippet: existingSnippet,
        message: 'Fact already exists in validation system',
        isDuplicate: true
      }, { status: 200 })
    }
    
    const snippet = {
      id: Date.now().toString(),
      content: body.content,
      source: {
        document: body.source.document,
        page: body.source.page,
        context: body.source.context,
        date: body.source.date
      },
      tags: body.tags || [],
      extractedFrom: body.extractedFrom || 'manual',
      confidence: body.confidence || 1.0,
      validations: {
        staff: { positive: 0, negative: 0 },
        community: { positive: 0, negative: 0 },
        elders: { positive: 0, negative: 0 }
      },
      status: 'draft',
      createdAt: new Date().toISOString()
    }

    validationSnippets.unshift(snippet) // Add to beginning
    
    console.log(`📝 New validation snippet created from ${body.extractedFrom}:`, snippet.content)
    
    return NextResponse.json({ 
      success: true, 
      snippet,
      message: 'Fact saved for validation',
      isDuplicate: false
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving validation snippet:', error)
    return NextResponse.json({ error: 'Failed to save snippet' }, { status: 500 })
  }
} 