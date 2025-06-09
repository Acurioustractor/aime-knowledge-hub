import { NextRequest, NextResponse } from 'next/server'
import { apiCache } from '../../../lib/cache'
import { airtable } from '../../../lib/airtable'

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'themes'
    const cachedThemes = apiCache.get(cacheKey)
    if (cachedThemes) {
      console.log('📦 Returning cached themes data')
      return NextResponse.json(cachedThemes)
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Missing Airtable configuration')
    }

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Themes?sort%5B0%5D%5Bfield%5D=Count&sort%5B0%5D%5Bdirection%5D=desc`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`)
    }

    const data = await response.json()
    
    const themes = data.records.map((record: any) => ({
      id: record.id,
      name: record.fields.Name || 'Unnamed Theme',
      description: record.fields.Description || 'No description available',
      count: record.fields.Count || 0,
    }))

    // Cache the result for 15 minutes (themes change less frequently)
    apiCache.set(cacheKey, themes, 15)

    return NextResponse.json(themes)
  } catch (error) {
    console.error('Themes API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
} 