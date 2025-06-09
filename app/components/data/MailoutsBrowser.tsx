'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Calendar, ExternalLink, Eye, Tag, CheckCircle, AlertCircle, Copy } from 'lucide-react'

interface Mailout {
  id: string
  name: string
  link: string | null
  date: string | null
  copy: string | null
  editorialCalendarUpdated: string | null
  theme: string | null
  createdTime: string
  status: string
}

interface MailoutsBrowserProps {
  searchQuery: string
  selectedStatuses: string[]
}

export default function MailoutsBrowser({ searchQuery, selectedStatuses }: MailoutsBrowserProps) {
  const router = useRouter()
  const [mailouts, setMailouts] = useState<Mailout[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name-asc' | 'name-desc'>('latest')
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true,
    totalCount: 0,
    allCount: 0
  })

  useEffect(() => {
    fetchMailouts(true) // Reset and fetch first page
  }, [sortBy, selectedStatuses])

  const fetchMailouts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setMailouts([])
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        setLoadingMore(true)
      }

      const page = reset ? 1 : pagination.page + 1
      const statusFilter = selectedStatuses.length > 0 ? selectedStatuses[0] : 'all'
      const response = await fetch(`/api/mailouts?page=${page}&limit=50&sortBy=${sortBy}&status=${statusFilter}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch mailouts')
      }
      
      const data = await response.json()
      
      if (reset) {
        setMailouts(data.mailouts)
      } else {
        setMailouts(prev => [...prev, ...data.mailouts])
      }
      
      setPagination({
        page: data.pagination.page,
        hasMore: data.pagination.hasMore,
        totalCount: data.pagination.totalCount,
        allCount: data.pagination.allCount || data.pagination.totalCount
      })
    } catch (err) {
      console.error('Error fetching mailouts:', err)
      setError('Failed to load mailouts. Please try again.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      fetchMailouts(false)
    }
  }

  // Client-side search filtering only
  const filteredMailouts = mailouts.filter(mailout => {
    if (!searchQuery) return true
    
    return mailout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mailout.copy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mailout.theme?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-orange-100 text-orange-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string, date: string | null) => {
    switch (status) {
      case 'sent':
        return 'Sent'
      case 'upcoming':
        if (date) {
          const mailoutDate = new Date(date)
          const now = new Date()
          const daysDiff = Math.floor((mailoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff === 0) return 'Today'
          if (daysDiff === 1) return 'Tomorrow'
          return `In ${daysDiff} days`
        }
        return 'Upcoming'
      case 'scheduled':
        return 'Scheduled'
      default:
        return 'No date set'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-secondary-600">Loading mailouts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={() => fetchMailouts(true)}
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
            AIME Mailouts ({filteredMailouts.length}
            {pagination.allCount > 0 && pagination.allCount !== filteredMailouts.length && (
              <span> of {pagination.allCount} total</span>
            )})
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Browse and explore AIME newsletters and email campaigns
            {pagination.hasMore && (
              <span className="block text-xs text-primary-600 mt-1">
                Showing {mailouts.length} loaded of {pagination.totalCount} 
                {selectedStatuses.length > 0 && ` filtered`} • Scroll down to load more
              </span>
            )}
            {pagination.allCount > 0 && !pagination.hasMore && (
              <span className="block text-xs text-secondary-500 mt-1">
                All {pagination.totalCount} mailouts loaded
                {selectedStatuses.length > 0 && ` (filtered from ${pagination.allCount} total)`}
              </span>
            )}
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

      {/* Mailouts Grid/List */}
      {filteredMailouts.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No mailouts found</h3>
          <p className="text-secondary-600">
            {searchQuery || selectedStatuses.length > 0
              ? 'Try adjusting your search or filters'
              : 'No mailouts available at the moment'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredMailouts.map((mailout) => {
            const statusColor = getStatusColor(mailout.status)
            const statusText = getStatusText(mailout.status, mailout.date)
            
            return (
              <div
                key={mailout.id}
                className={`card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex items-start' : 'flex flex-col'}`}
                onClick={(e) => {
                  // Prevent navigation if clicking on interactive elements
                  const target = e.target as HTMLElement
                  if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
                    return
                  }
                  try {
                    router.push(`/mailouts/${mailout.id}`)
                  } catch (error) {
                    console.error('Navigation error:', error)
                    // Fallback to window.location if router fails
                    window.location.href = `/mailouts/${mailout.id}`
                  }
                }}
              >
                {/* Icon section for grid view */}
                {viewMode === 'grid' && (
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    <Mail className="w-16 h-16 text-blue-500" />
                  </div>
                )}

                {/* Icon section for list view */}
                {viewMode === 'list' && (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded flex items-center justify-center flex-shrink-0 mr-4">
                    <Mail className="w-8 h-8 text-blue-500" />
                  </div>
                )}

                {/* Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col'}`}>
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Newsletter
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                      {mailout.name}
                    </h3>
                    
                    {mailout.copy && (
                      <p className="text-sm text-secondary-600 mb-3 line-clamp-3">
                        {mailout.copy}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-secondary-500 mb-3">
                      {mailout.date && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(mailout.date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {mailout.theme && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>{mailout.theme}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          try {
                          router.push(`/mailouts/${mailout.id}`)
                          } catch (error) {
                            console.error('Navigation error:', error)
                            // Fallback to window.location if router fails
                            window.location.href = `/mailouts/${mailout.id}`
                          }
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    </div>
                    
                    {mailout.link && (
                      <a
                        href={mailout.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-secondary-400 hover:text-secondary-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                Loading...
              </>
            ) : (
              'Load More Mailouts'
            )}
          </button>
        </div>
      )}
    </div>
  )
} 