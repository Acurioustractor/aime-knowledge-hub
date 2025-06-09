import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '../../../lib/cache'
import { airtable } from '../../../lib/airtable'

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'documents_with_themes'
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('📦 Returning cached documents data')
      return NextResponse.json(cachedData)
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Missing Airtable configuration')
    }

    // Fetch all documents with pagination
    let allRecords: any[] = []
    let offset: string | null = null
    
    do {
      const filter = encodeURIComponent("OR({Status}='Processed',{Status}='Indexed')")
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Documents?filterByFormula=${filter}&maxRecords=100`
      
      if (offset) {
        url += `&offset=${offset}`
      }

      console.log(`📊 Fetching documents from Airtable...`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`)
      }

      const data = await response.json()
      allRecords = allRecords.concat(data.records)
      offset = data.offset
      
      console.log(`📄 Fetched ${data.records.length} records, total so far: ${allRecords.length}`)
      
    } while (offset)
    
    console.log(`📊 Total records from Airtable: ${allRecords.length}`)
    console.log(`📄 Document titles: ${JSON.stringify(allRecords.map(r => r.fields.Title))}`)
    
    // Fetch themes to map IDs to names
    let themeMap: Record<string, string> = {}
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
        console.log(`Loaded ${themesData.records.length} themes`)
        themeMap = Object.fromEntries(
          themesData.records.map((theme: any) => [theme.id, theme.fields.Name])
        )
      } else {
        console.error('Themes API response not ok:', themesResponse.status)
      }
    } catch (error) {
      console.error('Error fetching themes for documents list:', error)
    }
    
    const documents = allRecords.map((record: any) => {
      try {
        // Convert theme IDs to names
        let themeNames = []
        if (record.fields.Themes && record.fields.Themes.length > 0) {
          themeNames = record.fields.Themes.map((themeId: string) => themeMap[themeId]).filter(Boolean)
        }
        
        const doc = {
          id: record.id,
          title: record.fields.Title || 'Untitled',
          author: record.fields.Author || 'Unknown',
          date: record.fields.Date || new Date().toISOString().split('T')[0],
          topics: themeNames,
          fullText: record.fields['Full Text'] || '',
          summary: record.fields.Summary || (record.fields['Full Text'] ? record.fields['Full Text'].substring(0, 200) + '...' : 'No summary available'),
          fileUrl: record.fields.File?.[0]?.url || null,
          processedAt: record.fields['Processed At'],
          chunkCount: record.fields['Chunk IDs'] ? record.fields['Chunk IDs'].split(',').length : 0,
        }
        
        return doc
      } catch (error) {
        console.error(`❌ Error processing document ${record.fields.Title}:`, error)
        // Return a basic version without themes if there's an error
        return {
          id: record.id,
          title: record.fields.Title || 'Untitled',
          author: record.fields.Author || 'Unknown',
          date: record.fields.Date || new Date().toISOString().split('T')[0],
          topics: [],
          fullText: record.fields['Full Text'] || '',
          summary: record.fields.Summary || 'No summary available',
          fileUrl: record.fields.File?.[0]?.url || null,
          processedAt: record.fields['Processed At'],
          chunkCount: record.fields['Chunk IDs'] ? record.fields['Chunk IDs'].split(',').length : 0,
        }
      }
    })

    console.log(`Processing ${documents.length} documents from Airtable`)
    console.log(`Returning ${documents.length} documents to frontend`)

    // Cache the result for 10 minutes
    const result = { documents }
    apiCache.set(cacheKey, result, 10)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
} 