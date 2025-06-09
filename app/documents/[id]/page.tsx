'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExternalLink, ArrowLeft, Calendar, User, FileText, Copy, Search, Share2, BookOpen } from 'lucide-react'
import DocumentChat from '../../components/DocumentChat'

interface Document {
  id: string
  title: string
  author: string
  date: string
  topics: string[]
  fullText: string
  summary: string
  fileUrl: string | null
  processedAt: string
  chunkCount: number
}

interface RelatedDocument {
  id: string
  title: string
  author: string
  date: string
  topics: string[]
  sharedThemes: number
}

interface Theme {
  id: string
  name: string
  description: string
  color: string
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [relatedDocuments, setRelatedDocuments] = useState<RelatedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullText, setShowFullText] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDocument(params.id as string)
      fetchThemes()
    }
  }, [params.id])

  useEffect(() => {
    if (document && document.topics.length > 0) {
      fetchRelatedDocuments()
    }
  }, [document])

  const fetchDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Document not found')
        } else {
          setError('Failed to fetch document')
        }
        return
      }
      
      const data = await response.json()
      setDocument(data.document)
    } catch (err) {
      setError('Failed to fetch document')
    } finally {
      setLoading(false)
    }
  }

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes')
      const data = await response.json()
      setThemes(data.themes || [])
    } catch (err) {
      console.error('Failed to fetch themes:', err)
    }
  }

  const fetchRelatedDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      
      if (document) {
        console.log('Current document themes:', document.topics)
        console.log('All documents:', data.documents.map((d: any) => ({ title: d.title, topics: d.topics })))
        
        const related = data.documents
          .filter((doc: any) => doc.id !== document.id)
          .map((doc: any) => {
            const sharedThemes = doc.topics?.filter((topic: string) => 
              document.topics.includes(topic)
            ).length || 0
            return {
              ...doc,
              sharedThemes
            }
          })
          .filter((doc: any) => doc.sharedThemes > 0)
          .sort((a: any, b: any) => b.sharedThemes - a.sharedThemes)
          .slice(0, 3)
        
        console.log('Related documents found:', related)
        setRelatedDocuments(related)
      }
    } catch (err) {
      console.error('Failed to fetch related documents:', err)
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

  const shareDocument = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document?.title,
          text: document?.summary,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      copyToClipboard(window.location.href)
    }
  }

  const getThemeColor = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName)
    return theme?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Not Found</h1>
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
            Back to Documents
            </button>
            <div className="flex items-center space-x-4">
              {document.fileUrl && (
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Document Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {document.title}
              </h1>

              {/* Document Metadata */}
              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{document.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(document.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>{document.chunkCount} searchable chunks</span>
                </div>
              </div>

              {/* Document Summary */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {document.summary}
                  </p>
                </div>
              </div>

              {/* Full Text Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Document Preview</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(document.fullText)}
                      className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copySuccess ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                      onClick={shareDocument}
                      className="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto shadow-sm">
                  <div className="whitespace-pre-wrap text-sm text-black font-sans leading-relaxed">
                    {showFullText 
                      ? document.fullText 
                      : `${document.fullText.substring(0, 2000)}${document.fullText.length > 2000 ? '...' : ''}`
                    }
                  </div>
                  {document.fullText.length > 2000 && (
                    <button
                      onClick={() => setShowFullText(!showFullText)}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showFullText ? 'Show Less' : 'Show Full Document'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Themes */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Themes</h3>
                {document.topics && document.topics.length > 0 ? (
                  <div className="space-y-2">
                    {document.topics.map((topic, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getThemeColor(topic)}`}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No themes assigned</p>
                )}
              </div>

              {/* Document Stats */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed</span>
                    <span className="text-gray-900">
                      {new Date(document.processedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vector Chunks</span>
                    <span className="text-gray-900">{document.chunkCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content Length</span>
                    <span className="text-gray-900">{document.fullText.length.toLocaleString()} chars</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {/* Debug info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  Debug: Found {relatedDocuments.length} related documents
                </p>
              </div>

              {/* Related Documents */}
              {relatedDocuments.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Documents ({relatedDocuments.length})</h3>
                  <div className="space-y-3">
                    {relatedDocuments.map((relatedDoc) => (
                      <div
                        key={relatedDoc.id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => router.push(`/documents/${relatedDoc.id}`)}
                      >
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {relatedDoc.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">by {relatedDoc.author}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {relatedDoc.sharedThemes} shared theme{relatedDoc.sharedThemes !== 1 ? 's' : ''}
                          </span>
                          <BookOpen className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {document.fileUrl && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Download Original
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document-Specific AI Assistant */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ask Questions About This Document
            </h2>
            <p className="text-gray-600">
              Use our AI assistant to explore this document in depth. Get insights, ask specific questions, 
              and discover connections within the content.
            </p>
          </div>
          
          <DocumentChat 
            documentId={document.id}
            documentTitle={document.title}
          />
        </div>
      </div>
    </div>
  )
} 