'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExternalLink, ArrowLeft, Calendar, Mail, Copy, Share2, Tag, Eye, CheckCircle, AlertCircle } from 'lucide-react'

interface Mailout {
  id: string
  name: string
  link: string | null
  date: string | null
  copy: string | null
  editorialCalendarUpdated: string | null
  theme: string | null
  createdTime: string
}

interface RelatedMailout {
  id: string
  name: string
  theme: string | null
  date: string | null
  sharedTheme: boolean
}

export default function MailoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [mailout, setMailout] = useState<Mailout | null>(null)
  const [relatedMailouts, setRelatedMailouts] = useState<RelatedMailout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchMailout(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (mailout && mailout.theme) {
      fetchRelatedMailouts()
    }
  }, [mailout])

  const fetchMailout = async (id: string) => {
    try {
      const response = await fetch('/api/mailouts')
      
      if (!response.ok) {
        setError('Failed to fetch mailout')
        return
      }
      
      const data = await response.json()
      const foundMailout = data.mailouts.find((m: Mailout) => m.id === id)
      
      if (!foundMailout) {
        setError('Mailout not found')
        return
      }
      
      setMailout(foundMailout)
    } catch (err) {
      setError('Failed to fetch mailout')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedMailouts = async () => {
    try {
      const response = await fetch('/api/mailouts')
      const data = await response.json()
      
      if (mailout) {
        const related = data.mailouts
          .filter((m: Mailout) => m.id !== mailout.id)
          .map((m: Mailout) => ({
            ...m,
            sharedTheme: m.theme === mailout.theme
          }))
          .filter((m: any) => m.sharedTheme)
          .sort((a: any, b: any) => {
            // Sort by date, most recent first
            if (!a.date && !b.date) return 0
            if (!a.date) return 1
            if (!b.date) return -1
            return new Date(b.date).getTime() - new Date(a.date).getTime()
          })
          .slice(0, 3)
        
        setRelatedMailouts(related)
      }
    } catch (err) {
      console.error('Failed to fetch related mailouts:', err)
    }
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

  const shareMailout = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: mailout?.name,
          text: mailout?.copy || undefined,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      copyToClipboard(window.location.href)
    }
  }

  const getStatusColor = (date: string | null) => {
    if (!date) return 'bg-gray-100 text-gray-800'
    
    const mailoutDate = new Date(date)
    const now = new Date()
    const daysDiff = Math.floor((mailoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return 'bg-green-100 text-green-800' // Past - sent
    if (daysDiff <= 7) return 'bg-orange-100 text-orange-800' // Upcoming
    return 'bg-blue-100 text-blue-800' // Future
  }

  const getStatusText = (date: string | null) => {
    if (!date) return 'No date set'
    
    const mailoutDate = new Date(date)
    const now = new Date()
    const daysDiff = Math.floor((mailoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return 'Sent'
    if (daysDiff === 0) return 'Today'
    if (daysDiff <= 7) return `In ${daysDiff} days`
    return 'Scheduled'
  }

  const getStatusIcon = (date: string | null) => {
    if (!date) return null
    
    const mailoutDate = new Date(date)
    const now = new Date()
    const daysDiff = Math.floor((mailoutDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return CheckCircle // Sent
    if (daysDiff <= 7) return AlertCircle // Upcoming
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mailout...</p>
        </div>
      </div>
    )
  }

  if (error || !mailout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mailout Not Found</h1>
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

  const StatusIcon = getStatusIcon(mailout.date)
  const statusColor = getStatusColor(mailout.date)
  const statusText = getStatusText(mailout.date)

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
              Back to Mailouts
            </button>
            <div className="flex items-center space-x-4">
              {mailout.link && (
                <a
                  href={mailout.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Mailout
                </a>
              )}
              <button
                onClick={shareMailout}
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
              {/* Hero Section */}
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <Mail className="w-20 h-20 text-blue-500" />
              </div>

              <div className="p-8">
                {/* Mailout Header */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          Newsletter
                        </span>
                        {StatusIcon && (
                          <StatusIcon className={`w-5 h-5 ${statusText === 'Sent' ? 'text-green-600' : 'text-orange-600'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {mailout.name}
                  </h1>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                      {statusText}
                    </div>
                    {mailout.theme && (
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span>{mailout.theme}</span>
                      </div>
                    )}
                    {mailout.date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(mailout.date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Copy/Content */}
                {mailout.copy && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Preview</h2>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {mailout.copy}
                      </p>
                    </div>
                  </div>
                )}

                {/* Editorial Updates */}
                {mailout.editorialCalendarUpdated && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Editorial Information</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Last updated: {new Date(mailout.editorialCalendarUpdated).toLocaleDateString()}</span>
                      </div>
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
                  {mailout.link && (
                    <a
                      href={mailout.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Mailout
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

              {/* Related Mailouts */}
              {relatedMailouts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Mailouts</h3>
                  <div className="space-y-4">
                    {relatedMailouts.map((relatedMailout) => (
                      <div
                        key={relatedMailout.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => {
                          try {
                            router.push(`/mailouts/${relatedMailout.id}`)
                          } catch (error) {
                            console.error('Navigation error:', error)
                            // Fallback to window.location if router fails
                            window.location.href = `/mailouts/${relatedMailout.id}`
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {relatedMailout.name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                              {relatedMailout.theme && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {relatedMailout.theme}
                                </span>
                              )}
                              {relatedMailout.date && (
                                <span>{new Date(relatedMailout.date).toLocaleDateString()}</span>
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
      </div>
    </div>
  )
} 