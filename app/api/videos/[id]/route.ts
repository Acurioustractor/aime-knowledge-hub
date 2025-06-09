import { NextRequest, NextResponse } from 'next/server'

// URL normalization function
const normalizeUrl = (url: string) => {
  if (!url) return url
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

// Function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  if (!url) return null
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Function to get reliable YouTube thumbnail URL
const getYouTubeThumbnail = (url: string) => {
  const videoId = getYouTubeVideoId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

// Function to extract Vimeo video ID from URL
const getVimeoVideoId = (url: string) => {
  if (!url) return null
  const regex = /(?:vimeo\.com\/(?:.*\/)?)([\d]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Function to get Vimeo thumbnail URL
const getVimeoThumbnail = (url: string) => {
  const videoId = getVimeoVideoId(url)
  if (!videoId) return null
  return null // Would need Vimeo API call
}

async function fetchAllVideos(apiKey: string) {
  let allVideos: any[] = []
  let dedicatedVideoUrls = new Set<string>()

  // Fetch YouTube videos
  try {
    const youtubeVideos = await fetchYouTubeVideos(apiKey)
    allVideos = allVideos.concat(youtubeVideos)
    youtubeVideos.forEach((video: any) => dedicatedVideoUrls.add(normalizeUrl(video.link)))
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
  }

  // Fetch Vimeo videos
  try {
    const vimeoVideos = await fetchVimeoVideos(apiKey)
    allVideos = allVideos.concat(vimeoVideos)
    vimeoVideos.forEach((video: any) => dedicatedVideoUrls.add(normalizeUrl(video.link)))
  } catch (error) {
    console.error('Error fetching Vimeo videos:', error)
  }

  // Fetch tools videos
  try {
    const toolsVideos = await fetchToolsVideos(apiKey)
    const uniqueToolsVideos = toolsVideos.filter((video: any) => !dedicatedVideoUrls.has(normalizeUrl(video.link)))
    allVideos = allVideos.concat(uniqueToolsVideos)
  } catch (error) {
    console.error('Error fetching tools videos:', error)
  }

  // Remove duplicates
  const uniqueVideos = allVideos.filter((video, index, self) => 
    index === self.findIndex(v => normalizeUrl(v.link) === normalizeUrl(video.link))
  )

  return uniqueVideos
}

async function fetchYouTubeVideos(apiKey: string) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_TOOLS_BASE_ID || 'app9CWGw8yR1D3cc6'
  const YOUTUBE_TABLE_ID = 'tblsZgLOSKg8P5BgM'
  
  return await fetchFromAirtableBase(apiKey, AIRTABLE_BASE_ID, YOUTUBE_TABLE_ID, 'YouTube')
}

async function fetchVimeoVideos(apiKey: string) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_TOOLS_BASE_ID || 'app9CWGw8yR1D3cc6'
  const VIMEO_TABLE_ID = 'tbl2VYajkZdxMQLU9'
  
  return await fetchFromAirtableBase(apiKey, AIRTABLE_BASE_ID, VIMEO_TABLE_ID, 'Vimeo')
}

async function fetchToolsVideos(apiKey: string) {
  const AIRTABLE_TOOLS_BASE_ID = process.env.AIRTABLE_TOOLS_BASE_ID || 'app9CWGw8yR1D3cc6'
  const AIRTABLE_TOOLS_TABLE = process.env.AIRTABLE_TOOLS_TABLE || 'tbltntGrds3BoFidd'
  
  let allRecords: any[] = []
  let offset: string | undefined = undefined
  
  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_TOOLS_BASE_ID}/${AIRTABLE_TOOLS_TABLE}?pageSize=100`
    
    if (offset) {
      url += `&offset=${encodeURIComponent(offset)}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    allRecords = allRecords.concat(data.records || [])
    offset = data.offset
    
  } while (offset)
  
  const videoTools = allRecords
    .filter((record: any) => 
      record.fields.Format === 'Video' && 
      record.fields.Link && 
      (record.fields.Link.includes('youtube.com') || 
       record.fields.Link.includes('youtu.be') || 
       record.fields.Link.includes('vimeo.com'))
    )
    .map((record: any) => {
      const link = record.fields.Link
      let thumbnail = null
      
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        thumbnail = getYouTubeThumbnail(link)
      } else if (link.includes('vimeo.com')) {
        thumbnail = getVimeoThumbnail(link)
      }

      return {
        id: record.id,
        name: record.fields.Name || 'Untitled Video',
        link: link,
        description: record.fields.Description || '',
        createdTime: record.createdTime,
        attachments: record.fields.Attachments || [],
        thumbnail: thumbnail,
        area: record.fields.Area || null,
        tags: record.fields.Tags || [],
        source: 'tools'
      }
    })

  return videoTools
}

async function fetchFromAirtableBase(apiKey: string, baseId: string, tableId: string, platform: string) {
  let allRecords: any[] = []
  let offset: string | undefined = undefined
  
  do {
    let url = `https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100`
    
    if (offset) {
      url += `&offset=${encodeURIComponent(offset)}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    allRecords = allRecords.concat(data.records || [])
    offset = data.offset
    
  } while (offset)

  const videos = allRecords
    .map((record: any) => {
      const url = record.fields.URL || record.fields.Link || record.fields.url || record.fields.link || 
                  record.fields.Video || record.fields.video || record.fields.VideoURL || record.fields.Url
      const title = record.fields.Title || record.fields.Name || record.fields.title || record.fields.name || 
                    record.fields.VideoTitle || record.fields.Video_Title || 'Untitled Video'
      const date = record.fields.Date || record.fields.PublishedAt || record.fields.date || 
                   record.fields.Published || record.fields.CreatedAt || record.createdTime
      const duration = record.fields.Duration || record.fields.duration || record.fields.Length || record.fields.length
      
      let thumbnail = null
      
      const thumbnailAttachments = record.fields.Thumbnails || record.fields.thumbnails || 
                                   record.fields.Attachments || record.fields.Thumbnail || 
                                   record.fields.thumbnail || record.fields['Thumbnail Attach'] ||
                                   record.fields['Thumbnail attach']
      
      if (thumbnailAttachments && thumbnailAttachments.length > 0) {
        thumbnail = thumbnailAttachments[0].url || thumbnailAttachments[0].thumbnails?.large?.url
      }
      
      if (!thumbnail && url) {
        if (platform.toLowerCase() === 'youtube') {
          thumbnail = getYouTubeThumbnail(url)
        } else if (platform.toLowerCase() === 'vimeo') {
          thumbnail = getVimeoThumbnail(url)
        }
      }
      
      return {
        id: `${platform.toLowerCase()}_${record.id}`,
        name: title,
        link: url,
        description: record.fields.Description || record.fields.description || record.fields.Notes || '',
        createdTime: date,
        duration: duration,
        attachments: thumbnailAttachments || [],
        thumbnail: thumbnail,
        area: record.fields.Area || record.fields.area || record.fields.Category || null,
        tags: record.fields.Tags || record.fields.tags || [],
        source: platform.toLowerCase()
      }
    })
    .filter((video: any) => {
      return video.link && (
        video.link.includes('youtube.com') || 
        video.link.includes('youtu.be') || 
        video.link.includes('vimeo.com')
      )
    })

  return videos
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
    
    if (!AIRTABLE_API_KEY) {
      throw new Error('Missing Airtable API key')
    }

    // Fetch all videos
    const allVideos = await fetchAllVideos(AIRTABLE_API_KEY)
    
    // Find the video with matching ID
    const video = allVideos.find((v: any) => v.id === params.id)

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
} 