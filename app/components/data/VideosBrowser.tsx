'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Calendar, ExternalLink, Eye, Tag, Youtube, Play, Clock, User } from 'lucide-react'

interface Video {
  id: string
  name: string
  link: string
  description?: string
  createdTime: string
  attachments?: any[]
  thumbnail?: string | null
  area?: string | null
  tags?: string[]
  source: string
  duration?: string
}

interface VideosBrowserProps {
  searchQuery: string
  selectedSources: string[]
  selectedYears: string[]
  selectedAreas: string[]
  selectedTags: string[]
}

export default function VideosBrowser({ 
  searchQuery, 
  selectedSources, 
  selectedYears, 
  selectedAreas, 
  selectedTags 
}: VideosBrowserProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name-asc' | 'name-desc'>('latest')
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    totalCount: 0
  })

  useEffect(() => {
    fetchVideos(true) // Reset and fetch first page
  }, [sortBy, selectedSources, selectedYears, selectedAreas, selectedTags])

  const fetchVideos = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setVideos([])
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        setLoadingMore(true)
      }

      const response = await fetch('/api/videos')
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data = await response.json()
      
      if (reset) {
        setVideos(data.videos || [])
      } else {
        setVideos(prev => [...prev, ...(data.videos || [])])
      }
      
      setPagination({
        page: 1,
        hasMore: false, // API doesn't support pagination yet
        totalCount: data.videos?.length || 0
      })
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to load videos. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Apply client-side filtering
  const filteredVideos = videos.filter(video => {
    // Search query filter
    if (searchQuery && !video.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !video.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !video.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false
    }
    
    // Source filter
    if (selectedSources.length > 0 && !selectedSources.includes(video.source)) {
      return false
    }
    
    // Year filter
    if (selectedYears.length > 0) {
      const videoYear = new Date(video.createdTime).getFullYear().toString()
      if (!selectedYears.includes(videoYear)) {
        return false
      }
    }
    
    // Area filter
    if (selectedAreas.length > 0 && video.area && !selectedAreas.includes(video.area)) {
      return false
    }
    
    // Tags filter
    if (selectedTags.length > 0 && (!video.tags || !video.tags.some(tag => selectedTags.includes(tag)))) {
      return false
    }
    
    return true
  })

  // Apply sorting
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      case 'oldest':
        return new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  const getVideoType = (url: string): 'youtube' | 'vimeo' | 'unknown' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    return 'unknown'
  }

  const getVideoIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />
      case 'vimeo':
        return <Video className="w-4 h-4 text-blue-600" />
      default:
        return <Play className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-secondary-600">Loading videos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={() => fetchVideos(true)}
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
            AIME Videos ({sortedVideos.length})
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Browse and explore AIME video content from YouTube, Vimeo, and tools
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest' | 'name-asc' | 'name-desc')}
            className="text-sm border border-secondary-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>

          {/* View Mode Buttons */}
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
      </div>

      {/* Videos Grid/List */}
      {sortedVideos.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No videos found</h3>
          <p className="text-secondary-600">
            {searchQuery || selectedSources.length > 0 || selectedYears.length > 0 || selectedAreas.length > 0 || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'No videos available at the moment'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {sortedVideos.map((video) => {
            const videoType = getVideoType(video.link)
            
            return (
              <div
                key={video.id}
                className={`card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex items-start' : 'flex flex-col'}`}
                onClick={(e) => {
                  // Prevent navigation if clicking on interactive elements
                  const target = e.target as HTMLElement
                  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                    return
                  }
                  try {
                    router.push(`/videos/${video.id}`)
                  } catch (error) {
                    console.error('Navigation error:', error)
                    // Fallback to window.location if router fails
                    window.location.href = `/videos/${video.id}`
                  }
                }}
              >
                {/* Thumbnail section for grid view */}
                {viewMode === 'grid' && (
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center">
                        {getVideoIcon(video.source)}
                        <span className="ml-2 text-sm text-gray-500 capitalize">{video.source}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      {video.duration || 'Video'}
                    </div>
                  </div>
                )}

                {/* Thumbnail section for list view */}
                {viewMode === 'list' && (
                  <div className="w-32 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded flex items-center justify-center flex-shrink-0 mr-4 relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getVideoIcon(video.source)
                    )}
                  </div>
                )}

                {/* Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
                  {/* Header with platform */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getVideoIcon(video.source)}
                      <span className="text-xs font-medium text-gray-600 capitalize">
                        {video.source}
                      </span>
                    </div>
                    {video.duration && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{video.duration}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                      {video.name}
                    </h3>
                    
                    {video.description && (
                      <p className="text-sm text-secondary-600 mb-3 line-clamp-3">
                        {video.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-secondary-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(video.createdTime)}</span>
                      </div>
                      {video.area && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{video.area}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {video.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{video.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        try {
                          router.push(`/videos/${video.id}`)
                        } catch (error) {
                          console.error('Navigation error:', error)
                          // Fallback to window.location if router fails
                          window.location.href = `/videos/${video.id}`
                        }
                      }}
                      className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                    
                    <a
                      href={video.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-secondary-400 hover:text-secondary-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 