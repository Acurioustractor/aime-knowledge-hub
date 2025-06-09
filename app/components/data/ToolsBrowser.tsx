'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Calendar, Link, Tag, ExternalLink, Eye, Video, FileText, Volume2, CheckCircle, AlertCircle, Image } from 'lucide-react'

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

interface ToolsBrowserProps {
  searchQuery: string
  selectedFormats: string[]
  selectedAreas: string[]
  selectedTags: string[]
}

const formatIcons = {
  'Document': FileText,
  'Video': Video,
  'Audio': Volume2,
  'Image': Image,
  'Unknown': Wrench,
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

export default function ToolsBrowser({ searchQuery, selectedFormats, selectedAreas, selectedTags }: ToolsBrowserProps) {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    totalCount: 0
  })

  useEffect(() => {
    fetchTools(true) // Reset and fetch first page
  }, [])

  const fetchTools = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setTools([])
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        setLoadingMore(true)
      }

      const page = reset ? 1 : pagination.page + 1
      const response = await fetch(`/api/tools?page=${page}&limit=50`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tools')
      }
      
      const data = await response.json()
      
      if (reset) {
        setTools(data.tools)
      } else {
        setTools(prev => [...prev, ...data.tools])
      }
      
      setPagination({
        page: data.pagination.page,
        hasMore: data.pagination.hasMore,
        totalCount: data.pagination.totalCount
      })
    } catch (err) {
      console.error('Error fetching tools:', err)
      setError('Failed to load tools. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchTools(false)
    }
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch = !searchQuery || 
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(tool.format)
    const matchesArea = selectedAreas.length === 0 || (tool.area && selectedAreas.includes(tool.area))
    const matchesTags = selectedTags.length === 0 || tool.tags.some(tag => selectedTags.includes(tag))
    
    return matchesSearch && matchesFormat && matchesArea && matchesTags
  })

  const getThumbnail = (tool: Tool) => {
    if (tool.attachments && tool.attachments.length > 0) {
      const attachment = tool.attachments[0]
      
      // Prefer high-quality thumbnails in order of preference
      if (attachment.thumbnails?.large?.url) {
        return attachment.thumbnails.large.url
      }
      if (attachment.thumbnails?.full?.url) {
        return attachment.thumbnails.full.url
      }
      if (attachment.url && attachment.type?.startsWith('image/')) {
        return attachment.url
      }
      // Fallback to small thumbnail only if nothing else is available
      if (attachment.thumbnails?.small?.url) {
        return attachment.thumbnails.small.url
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-secondary-600">Loading tools...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={() => fetchTools(true)}
          className="mt-3 btn-primary text-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-secondary-900">
            Tools Hub ({filteredTools.length}{pagination.totalCount > tools.length ? ` of ${pagination.totalCount}` : ''})
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Browse and explore AIME tools, resources, and materials
            {pagination.totalCount > tools.length && (
              <span className="block text-xs text-primary-600 mt-1">
                Showing {tools.length} loaded • Scroll down to load more
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-secondary-400 hover:text-secondary-600'}`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-secondary-400 hover:text-secondary-600'}`}
          >
            <div className="w-4 h-4 flex flex-col space-y-1">
              <div className="bg-current h-0.5 rounded"></div>
              <div className="bg-current h-0.5 rounded"></div>
              <div className="bg-current h-0.5 rounded"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Tools Grid/List */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No tools found</h3>
          <p className="text-secondary-600">
            {searchQuery || selectedFormats.length > 0 || selectedAreas.length > 0 || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'No tools available at the moment'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredTools.map((tool) => {
            const FormatIcon = formatIcons[tool.format as keyof typeof formatIcons] || Wrench
            const StatusIcon = statusIcons[tool.status as keyof typeof statusIcons]
            const thumbnail = getThumbnail(tool)
            
            return (
              <div
                key={tool.id}
                className={`card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex items-start' : 'flex flex-col'}`}
                onClick={() => router.push(`/tools/${tool.id}`)}
              >
                {/* Thumbnail */}
                {viewMode === 'grid' && (
                  <div className="aspect-video bg-secondary-100 flex items-center justify-center overflow-hidden">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={tool.name}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <FormatIcon className={`w-12 h-12 text-secondary-400 ${thumbnail ? 'hidden' : ''}`} />
                  </div>
                )}

                {/* List view thumbnail */}
                {viewMode === 'list' && (
                  <div className="w-20 h-20 bg-secondary-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0 mr-4">
                    {thumbnail ? (
                      <img 
                        src={thumbnail} 
                        alt={tool.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FormatIcon className="w-8 h-8 text-secondary-400" />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
                  {/* Header with format and status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {tool.format}
                      </span>
                    </div>
                    {StatusIcon && (
                      <StatusIcon className={`w-4 h-4 ${tool.status === 'Current – up to date' ? 'text-green-600' : 'text-orange-600'}`} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                      {tool.name}
                    </h3>
                    
                    {tool.description && (
                      <p className="text-sm text-secondary-600 mb-3 line-clamp-3">
                        {tool.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-secondary-500 mb-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[tool.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {tool.status}
                      </div>
                      {tool.area && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{tool.area}</span>
                        </div>
                      )}
                    </div>
                    
                    {tool.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tool.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center space-x-1 text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded"
                          >
                            <Tag className="w-2 h-2" />
                            <span>{tag}</span>
                          </span>
                        ))}
                        {tool.tags.length > 3 && (
                          <span className="text-xs text-secondary-500">
                            +{tool.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/tools/${tool.id}`)
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                    
                    {tool.link && (
                      <a
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-xs text-secondary-600 hover:text-secondary-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Load More / Infinite Scroll */}
      {pagination.hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-primary flex items-center space-x-2"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading more tools...</span>
              </>
            ) : (
              <>
                <span>Load More Tools</span>
                <span className="text-xs opacity-75">
                  ({tools.length} of {pagination.totalCount})
                </span>
              </>
            )}
          </button>
        </div>
      )}
      
      {!pagination.hasMore && tools.length > 0 && (
        <div className="text-center mt-8 text-sm text-secondary-500">
          All tools loaded ({tools.length} total)
        </div>
      )}
    </div>
  )
} 