import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    const AIRTABLE_TOOLS_BASE_ID = process.env.AIRTABLE_TOOLS_BASE_ID || 'app9CWGw8yR1D3cc6'
    const AIRTABLE_TOOLS_TABLE = process.env.AIRTABLE_TOOLS_TABLE || 'tbltntGrds3BoFidd'
    
    if (!AIRTABLE_API_KEY) {
      throw new Error('Missing Airtable API key')
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const loadAll = searchParams.get('loadAll') === 'true'
    const filterOnly = searchParams.get('filterOnly') === 'true'

    // If only requesting filter data, fetch minimal records
    if (filterOnly) {
      const url = `https://api.airtable.com/v0/${AIRTABLE_TOOLS_BASE_ID}/${AIRTABLE_TOOLS_TABLE}?maxRecords=200&fields=Format,Area,Tags`
      
      console.log(`🔧 Fetching filter data from Airtable...`)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Extract unique values for filters
      const formats = new Set<string>()
      const areas = new Set<string>()
      const tags = new Set<string>()
      
      data.records.forEach((record: any) => {
        if (record.fields.Format) formats.add(record.fields.Format)
        if (record.fields.Area) areas.add(record.fields.Area)
        if (record.fields.Tags && Array.isArray(record.fields.Tags)) {
          record.fields.Tags.forEach((tag: string) => tags.add(tag))
        }
      })

      return NextResponse.json({
        filterData: {
          formats: Array.from(formats),
          areas: Array.from(areas),
          tags: Array.from(tags).slice(0, 50) // Limit tags for performance
        }
      })
    }

    // Fetch tools with pagination
    let allRecords: any[] = []
    let offset: string | null = null
    let recordsToFetch = loadAll ? Infinity : limit
    let recordsFetched = 0
    
    do {
      const maxRecords = Math.min(100, recordsToFetch - recordsFetched)
      let url = `https://api.airtable.com/v0/${AIRTABLE_TOOLS_BASE_ID}/${AIRTABLE_TOOLS_TABLE}?maxRecords=${maxRecords}`
      
      if (offset) {
        url += `&offset=${offset}`
      }

      console.log(`🔧 Fetching tools from Airtable...`)
      
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
      recordsFetched += data.records.length
      offset = data.offset
      
      console.log(`🔧 Fetched ${data.records.length} tools, total so far: ${allRecords.length}`)
      
      // Break if we've fetched enough records (but not if loadAll=true) or if there's no more data
      if (!loadAll && recordsFetched >= recordsToFetch) break
      if (!offset) break
      
    } while (offset && recordsFetched < recordsToFetch)
    
    console.log(`🔧 Total tools from Airtable: ${allRecords.length}`)
    console.log(`🔧 Tool names: ${JSON.stringify(allRecords.map(r => r.fields.Name))}`)
    
    const tools = allRecords.map((record: any) => {
      try {
        const tool = {
          id: record.id,
          name: record.fields.Name || 'Untitled Tool',
          tool: record.fields.Tool || null,
          status: record.fields.Status || 'Unknown',
          format: record.fields.Format || 'Unknown',
          area: record.fields.Area || null,
          link: record.fields.Link || null,
          tags: record.fields.Tags || [],
          attachments: record.fields.Attachments || [],
          description: record.fields.Description || '',
          createdTime: record.createdTime,
        }
        
        return tool
      } catch (error) {
        console.error(`❌ Error processing tool ${record.fields.Name}:`, error)
        return {
          id: record.id,
          name: record.fields.Name || 'Untitled Tool',
          tool: null,
          status: 'Unknown',
          format: 'Unknown',
          area: null,
          link: null,
          tags: [],
          attachments: [],
          description: '',
          createdTime: record.createdTime,
        }
      }
    })

    console.log(`Processing ${tools.length} tools from Airtable`)
    console.log(`Returning ${tools.length} tools to frontend`)

    // Calculate pagination info
    const totalCount = loadAll ? tools.length : 739 // Known total from user
    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    return NextResponse.json({ 
      tools,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
        loadedCount: tools.length
      }
    })
  } catch (error) {
    console.error('Tools API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
} 