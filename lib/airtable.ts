// Centralized Airtable client and utilities

interface AirtableConfig {
  apiKey: string
  baseId: string
}

export class AirtableClient {
  private config: AirtableConfig

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID
    
    if (!apiKey || !baseId) {
      throw new Error('Missing Airtable configuration. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.')
    }
    
    this.config = { apiKey, baseId }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  private getBaseUrl() {
    return `https://api.airtable.com/v0/${this.config.baseId}`
  }

  async fetchTable(tableName: string, options: {
    filterByFormula?: string
    maxRecords?: number
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
  } = {}) {
    let allRecords: any[] = []
    let offset: string | null = null
    
    do {
      const params = new URLSearchParams({
        maxRecords: (options.maxRecords || 100).toString()
      })
      
      if (options.filterByFormula) {
        params.append('filterByFormula', options.filterByFormula)
      }
      
      if (options.sort) {
        options.sort.forEach((sort, index) => {
          params.append(`sort[${index}][field]`, sort.field)
          params.append(`sort[${index}][direction]`, sort.direction)
        })
      }
      
      if (offset) {
        params.append('offset', offset)
      }

      const url = `${this.getBaseUrl()}/${tableName}?${params}`
      const response = await fetch(url, { headers: this.getHeaders() })

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      allRecords = allRecords.concat(data.records)
      offset = data.offset
      
    } while (offset)
    
    return allRecords
  }

  async fetchRecord(tableName: string, recordId: string) {
    const url = `${this.getBaseUrl()}/${tableName}/${recordId}`
    const response = await fetch(url, { headers: this.getHeaders() })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }
}

// Singleton instance
export const airtable = new AirtableClient() 