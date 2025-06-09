import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_TOOLS_BASE_ID || 'app9CWGw8yR1D3cc6'
  const AIRTABLE_MAILOUTS_TABLE = 'tblwGCCayDWHo6H1g' // Mailouts table ID

  
  if (!AIRTABLE_API_KEY) {
    throw new Error('Missing Airtable API key')
  }

  try {
    console.log('📧 Fetching mailouts from Airtable...')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const filterOnly = searchParams.get('filterOnly') === 'true'
    const sortBy = searchParams.get('sortBy') || 'latest'
    const statusFilter = searchParams.get('status') || 'all'
    
    if (filterOnly) {
      console.log('📧 Fetching filter data from Airtable...')
      
      // For filter data, we only need a small sample to get available statuses
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_MAILOUTS_TABLE}?maxRecords=100&fields=Date`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Generate status categories based on dates
      const statuses = ['sent', 'upcoming', 'scheduled', 'no-date']
      
      return NextResponse.json({
        statuses
      })
    }
    
    // Fetch ALL mailouts from Airtable first
    let allRecords: any[] = []
    let offset: string | null = null
    let fetchCount = 0
    
    console.log('📧 ⚡ FORCING FETCH OF ALL MAILOUTS - NO VIEW RESTRICTIONS ⚡')
    
    do {
      fetchCount++
      // Force fetch without any view restrictions and with explicit pagination
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_MAILOUTS_TABLE}`
      
      // Build query parameters
      const params = new URLSearchParams()
      // Don't specify maxRecords - let Airtable use default pagination
      if (offset) {
        params.set('offset', offset)
      }
      
      const fullUrl = `${url}?${params.toString()}`
      console.log(`📧 Fetch ${fetchCount}: ${fullUrl}`)

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      })

      if (!response.ok) {
        console.log(`📧 Fetch ${fetchCount}: Error response:`, response.status, response.statusText)
        throw new Error(`Airtable API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Debug: Log the response details
      console.log(`📧 Fetch ${fetchCount}: Got ${data.records?.length || 0} records, total so far: ${allRecords.length + (data.records?.length || 0)}`)
      console.log(`📧 Fetch ${fetchCount}: Has offset? ${!!data.offset}`)
      console.log(`📧 Fetch ${fetchCount}: Offset value:`, data.offset)
      console.log(`📧 Fetch ${fetchCount}: Response keys:`, Object.keys(data))
      
      if (data.records) {
        allRecords = allRecords.concat(data.records)
        console.log(`📧 Fetch ${fetchCount}: Successfully added ${data.records.length} records`)
      }
      
      offset = data.offset || null
      
      // Safety check - but allow for more pages since we know there are 246 records
      if (fetchCount >= 20) {
        console.log(`📧 Reached safety limit of ${fetchCount} fetch attempts`)
        break
      }
      
      // Additional safety: if we got less than expected records and no offset, something is wrong
      if (data.records && data.records.length < 100 && !data.offset) {
        console.log(`📧 Fetch ${fetchCount}: Got ${data.records.length} records (less than 100) with no offset - likely end of data`)
      }
      
    } while (offset) // Continue while there's an offset
    
    console.log(`📧 🎉 FINAL TOTAL: ${allRecords.length} mailouts from Airtable`)
    console.log(`📧 Total fetch attempts: ${fetchCount}`)
    
    // Additional verification
    if (allRecords.length < 200) {
      console.log(`📧 ⚠️  WARNING: Only got ${allRecords.length} records, expected 246+`)
      console.log(`📧 ⚠️  This suggests there might be view restrictions or API limits`)
    }
    
    // Process all records
    const allMailouts = allRecords.map((record: any) => {
      const fields = record.fields
      const mailoutDate = fields['Date'] ? new Date(fields['Date']) : null
      const now = new Date()
      
      // Determine status based on date
      let status = 'no-date'
      if (mailoutDate) {
        if (mailoutDate < now) {
          status = 'sent'
        } else if (mailoutDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          status = 'upcoming'
        } else {
          status = 'scheduled'
        }
      }
      
      return {
        id: record.id,
        name: fields['Name'] || '',
        link: fields['Link'] || null,
        date: fields['Date'] || null,
        copy: fields['Copy'] || null,
        editorialCalendarUpdated: fields['Editorial Calendar Updated'] || null,
        theme: Array.isArray(fields['Theme']) 
          ? fields['Theme'][0] 
          : fields['Theme'] || null,
        createdTime: record.createdTime,
        status
      }
    })
    
    // Filter by status if specified
    let filteredMailouts = allMailouts
    if (statusFilter !== 'all') {
      filteredMailouts = allMailouts.filter(mailout => mailout.status === statusFilter)
    }
    
    // Sort the mailouts
    filteredMailouts.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          const dateA = a.date ? new Date(a.date) : new Date(0)
          const dateB = b.date ? new Date(b.date) : new Date(0)
          return dateB.getTime() - dateA.getTime()
        case 'oldest':
          const dateA2 = a.date ? new Date(a.date) : new Date(0)
          const dateB2 = b.date ? new Date(b.date) : new Date(0)
          return dateA2.getTime() - dateB2.getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })
    
    // Apply pagination to filtered and sorted results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMailouts = filteredMailouts.slice(startIndex, endIndex)
    
    console.log(`📧 Filtered to ${filteredMailouts.length} mailouts`)
    console.log(`📧 Returning page ${page} with ${paginatedMailouts.length} mailouts`)
    console.log(`📧 Top 5 mailout names: ${JSON.stringify(paginatedMailouts.slice(0, 5).map(m => m.name))}`)
    
    // Calculate pagination info
    const totalCount = filteredMailouts.length
    const hasMore = endIndex < totalCount
    
    return NextResponse.json({
      mailouts: paginatedMailouts,
      pagination: {
        page,
        limit,
        hasMore,
        totalCount,
        filteredCount: totalCount,
        allCount: allMailouts.length
      }
    })
    
  } catch (error: any) {
    console.error('Mailouts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mailouts', details: error.message },
      { status: 500 }
    )
  }
}