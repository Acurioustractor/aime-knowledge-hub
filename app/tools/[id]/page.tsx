'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExternalLink, ArrowLeft, Calendar, User, FileText, Copy, Search, Share2, BookOpen, Wrench, Tag, Video, Volume2, CheckCircle, AlertCircle, Link, Image, Play, Download, Eye } from 'lucide-react'

interface Tool {
  id: string
  name: string
  tool: string | null
  status: string
  format: string
  area: string | null
  link: string | null
  tags: string[]
  attachments: any[]
  description: string
  createdTime: string
}

interface RelatedTool {
  id: string
  name: string
  format: string
  area: string | null
  tags: string[]
  sharedTags: number
}

const formatIcons = {
  'Document': FileText,
  'Video': Video,
  'Audio': Volume2,
  'Image': Image,
}

const statusColors = {
  'Current – up to date': 'bg-green-100 text-green-800',
  'Current – needs update': 'bg-orange-100 text-orange-800',
  'Draft': 'bg-blue-100 text-blue-800',
  'Archived': 'bg-gray-100 text-gray-800',
  'Internal': 'bg-purple-100 text-purple-800',
  'Unknown': 'bg-gray-100 text-gray-800',
}

const statusIcons = {
  'Current – up to date': CheckCircle,
  'Current – needs update': AlertCircle,
}

export default function ToolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tool, setTool] = useState<Tool | null>(null)
  const [relatedTools, setRelatedTools] = useState<RelatedTool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTool(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (tool && (tool.tags.length > 0 || tool.area)) {
      fetchRelatedTools()
    }
  }, [tool])

  const fetchTool = async (id: string) => {
    try {
      const response = await fetch('/api/tools')
      
      if (!response.ok) {
        setError('Failed to fetch tool')
        return
      }
      
      const data = await response.json()
      const foundTool = data.tools.find((t: Tool) => t.id === id)
      
      if (!foundTool) {
        setError('Tool not found')
        return
      }
      
      setTool(foundTool)
    } catch (err) {
      setError('Failed to fetch tool')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedTools = async () => {
    try {
      const response = await fetch('/api/tools')
      const data = await response.json()
      
      if (tool) {
        const related = data.tools
          .filter((t: Tool) => t.id !== tool.id)
          .map((t: Tool) => {
            const sharedTags = t.tags?.filter((tag: string) => 
              tool.tags.includes(tag)
            ).length || 0
            const sameArea = t.area && tool.area && t.area === tool.area ? 1 : 0
            const sameFormat = t.format === tool.format ? 0.5 : 0
            
            return {
              ...t,
              sharedTags: sharedTags + sameArea + sameFormat
            }
          })
          .filter((t: any) => t.sharedTags > 0)
          .sort((a: any, b: any) => b.sharedTags - a.sharedTags)
          .slice(0, 3)
        
        setRelatedTools(related)
      }
    } catch (err) {
      console.error('Failed to fetch related tools:', err)
    }
  }

  const getThumbnail = (tool: Tool) => {
    if (tool.attachments && tool.attachments.length > 0) {
      const attachment = tool.attachments[0]
      
      // Prefer high-quality thumbnails
      if (attachment.thumbnails?.large?.url) {
        return attachment.thumbnails.large.url
      }
      if (attachment.thumbnails?.full?.url) {
        return attachment.thumbnails.full.url
      }
      if (attachment.url && attachment.type?.startsWith('image/')) {
        return attachment.url
      }
      if (attachment.thumbnails?.small?.url) {
        return attachment.thumbnails.small.url
      }
    }
    return null
  }

  const getVideoEmbed = (url: string) => {
    if (!url) return null
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    
    // Direct video files
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url
    }
    
    return null
  }

  const isImageFile = (attachment: any) => {
    return attachment.type?.startsWith('image/') || 
           attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  }

  const isVideoFile = (attachment: any) => {
    return attachment.type?.startsWith('video/') || 
           attachment.filename?.match(/\.(mp4|webm|ogg|mov|avi)$/i)
  }

  const isDocumentFile = (attachment: any) => {
    return attachment.type?.startsWith('application/') || 
           attachment.filename?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const shareTool = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tool?.name,
          text: tool?.description,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      copyToClipboard(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tool...</p>
        </div>
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tool Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const FormatIcon = formatIcons[tool.format as keyof typeof formatIcons] || Wrench
  const StatusIcon = statusIcons[tool.status as keyof typeof statusIcons]
  const thumbnail = getThumbnail(tool)
  const videoEmbed = tool.link ? getVideoEmbed(tool.link) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Tools
            </button>
            <div className="flex items-center space-x-4">
              {tool.link && (
                <a
                  href={tool.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Tool
                </a>
              )}
              <button
                onClick={shareTool}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Hero Media Section */}
              {(thumbnail || videoEmbed) && (
                <div className="aspect-video bg-gray-100 relative">
                  {videoEmbed && tool.format === 'Video' ? (
                    <div className="w-full h-full">
                      {videoEmbed.includes('youtube.com') || videoEmbed.includes('vimeo.com') ? (
                        <iframe
                          src={videoEmbed}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={videoEmbed}
                          controls
                          className="w-full h-full object-cover"
                          poster={thumbnail || undefined}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ) : thumbnail ? (
                    <div className="relative w-full h-full group">
                      <img 
                        src={thumbnail} 
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                      {tool.format === 'Video' && tool.link && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={tool.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 bg-white bg-opacity-90 text-gray-900 px-4 py-2 rounded-lg hover:bg-opacity-100 transition-all"
                          >
                            <Play className="w-5 h-5" />
                            <span>Watch Video</span>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FormatIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
              )}

              <div className="p-8">
                {/* Tool Header */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <FormatIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {tool.format}
                        </span>
                        {StatusIcon && (
                          <StatusIcon className={`w-5 h-5 ${tool.status === 'Current – up to date' ? 'text-green-600' : 'text-orange-600'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {tool.name}
                  </h1>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusColors[tool.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {tool.status}
                    </div>
                    {tool.area && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{tool.area}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(tool.createdTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {tool.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                {tool.description && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Attachments */}
                {tool.attachments && tool.attachments.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Attachments</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tool.attachments.map((attachment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {/* Attachment Preview */}
                          <div className="aspect-video bg-gray-50 flex items-center justify-center relative">
                            {isImageFile(attachment) ? (
                              <img
                                src={attachment.thumbnails?.large?.url || attachment.url}
                                alt={attachment.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : isVideoFile(attachment) ? (
                              <div className="relative w-full h-full">
                                {attachment.thumbnails?.large?.url ? (
                                  <img
                                    src={attachment.thumbnails.large.url}
                                    alt={attachment.filename}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <Video className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            ) : isDocumentFile(attachment) ? (
                              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                                <FileText className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500 text-center px-2">
                                  {attachment.filename?.split('.').pop()?.toUpperCase() || 'DOC'}
                                </span>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <FileText className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Attachment Info */}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                              {attachment.filename || `Attachment ${index + 1}`}
                            </h4>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {attachment.size && (
                                <span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                              <div className="flex items-center space-x-2">
                                {attachment.url && (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </a>
                                )}
                                {attachment.url && (
                                  <a
                                    href={attachment.url}
                                    download
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    Download
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {tool.link && (
                    <a
                      href={tool.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Tool
                    </a>
                  )}
                  <button
                    onClick={() => copyToClipboard(window.location.href)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Related Tools */}
              {relatedTools.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Tools</h3>
                  <div className="space-y-4">
                    {relatedTools.map((relatedTool) => {
                      const RelatedFormatIcon = formatIcons[relatedTool.format as keyof typeof formatIcons] || Wrench
                      return (
                        <div
                          key={relatedTool.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                          onClick={() => router.push(`/tools/${relatedTool.id}`)}
                        >
                          <div className="flex items-start space-x-3">
                            <RelatedFormatIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {relatedTool.name}
                              </h4>
                              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {relatedTool.format}
                                </span>
                                {relatedTool.area && (
                                  <span>{relatedTool.area}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 