import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Missing Airtable configuration')
    }

    // Fetch the specific document from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Documents/${params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    if (response.status === 404) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`)
    }

    const data = await response.json()
    const record = data
    const fields = record.fields
    
    // Fetch theme names if theme IDs exist
    let themeNames = []
    if (fields.Themes && fields.Themes.length > 0) {
      try {
        const themesResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Themes`,
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            },
          }
        )
        
        if (themesResponse.ok) {
          const themesData = await themesResponse.json()
          const themeMap = Object.fromEntries(
            themesData.records.map((theme: any) => [theme.id, theme.fields.Name])
          )
          themeNames = fields.Themes.map((themeId: string) => themeMap[themeId]).filter(Boolean)
        }
      } catch (error) {
        console.error('Error fetching themes:', error)
        // Fallback to showing IDs if theme fetch fails
        themeNames = fields.Themes || []
      }
    }
    
    // Format the document data
    const document = {
      id: record.id,
      title: fields.Title || 'Untitled Document',
      author: fields.Author || 'Unknown',
      date: fields.Date || new Date().toISOString().split('T')[0],
      topics: themeNames,
      fullText: fields['Full Text'] || '',
      summary: fields.Summary || 'No summary available',
      fileUrl: fields.File && fields.File[0] ? fields.File[0].url : null,
      processedAt: fields['Created'] || fields['Last Modified'] || new Date().toISOString(),
      chunkCount: fields['Chunk IDs']?.length || 0,
      wordCount: fields['Word Count'] || 0,
      language: fields.Language || 'Unknown'
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
} 