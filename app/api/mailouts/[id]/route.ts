import { NextRequest, NextResponse } from 'next/server'
import Airtable from 'airtable'

// Configure Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_TOOLS_BASE_ID!)

interface MailoutRecord {
  id: string
  name: string
  link: string | null
  date: string | null
  copy: string | null
  editorialCalendarUpdated: string | null
  theme: string | null
  createdTime: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📧 Fetching mailout ${params.id} from Airtable...`)
    
    const tableId = 'tblwGCCayDWHo6H1g' // Mailouts table ID
    
    const record = await base(tableId).find(params.id)
    
    const fields = record.fields
    const mailout: MailoutRecord = {
      id: record.id,
      name: String(fields['Name'] || ''),
      link: fields['Link'] ? String(fields['Link']) : null,
      date: fields['Date'] ? String(fields['Date']) : null,
      copy: fields['Copy'] ? String(fields['Copy']) : null,
      editorialCalendarUpdated: fields['Editorial Calendar Updated'] ? String(fields['Editorial Calendar Updated']) : null,
      theme: Array.isArray(fields['Theme (from Editor) (Linked from Theme)']) 
        ? String(fields['Theme (from Editor) (Linked from Theme)'][0])
        : fields['Theme (from Editor) (Linked from Theme)'] ? String(fields['Theme (from Editor) (Linked from Theme)']) : null,
      createdTime: (record as any).createdTime || new Date().toISOString()
    }
    
    console.log(`📧 Found mailout: ${mailout.name}`)
    
    return NextResponse.json(mailout)
    
  } catch (error: any) {
    console.error('Mailout API error:', error)
    
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Mailout not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mailout', details: error.message },
      { status: 500 }
    )
  }
} 