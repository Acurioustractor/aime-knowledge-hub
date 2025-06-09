'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, User, Tag, ExternalLink, Download, Eye } from 'lucide-react'

interface Document {
  id: string
  title: string
  author: string
  date: string
  topics: string[]
  fileUrl?: string
  fullText: string
  summary?: string
}

interface DocumentBrowserProps {
  searchQuery: string
  selectedThemes: string[]
}

export default function DocumentBrowser({ searchQuery, selectedThemes }: DocumentBrowserProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents')
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      
      const data = await response.json()
      setDocuments(data.documents)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents. Please try again.')
      // Mock data for development
      setDocuments([
        {
          id: '1',
          title: 'AI Ethics in Healthcare: A Comprehensive Framework',
          author: 'Dr. Sarah Johnson',
          date: '2024-01-15',
          topics: ['AI Ethics', 'Healthcare', 'Framework'],
          fullText: 'This document explores the ethical implications of AI in healthcare...',
          summary: 'A comprehensive framework for implementing ethical AI practices in healthcare settings.',

        },
        {
          id: '2',
          title: 'Machine Learning Applications in Climate Science',
          author: 'Prof. Michael Chen',
          date: '2024-01-10',
          topics: ['Machine Learning', 'Climate Science', 'Research'],
          fullText: 'This research paper discusses various ML applications in climate modeling...',
          summary: 'Exploring how machine learning can enhance climate prediction models.',

        },
        {
          id: '3',
          title: 'The Future of Work: AI and Human Collaboration',
          author: 'Dr. Emily Rodriguez',
          date: '2024-01-05',
          topics: ['Future of Work', 'AI Collaboration', 'Human-AI'],
          fullText: 'An analysis of how AI will reshape the workplace and human roles...',
          summary: 'Examining the evolving relationship between AI and human workers.',

        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fullText.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesThemes = selectedThemes.length === 0 ||
      selectedThemes.some(theme => doc.topics.includes(theme))
    
    return matchesSearch && matchesThemes
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-secondary-600">Loading documents...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={fetchDocuments}
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
            Documents ({filteredDocuments.length})
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            Browse and explore AIME research documents
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

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents found</h3>
          <p className="text-secondary-600">
            {searchQuery || selectedThemes.length > 0
              ? 'Try adjusting your search or filters'
              : 'No documents available at the moment'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`card p-6 cursor-pointer hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex items-start space-x-4' : ''}`}
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              {viewMode === 'grid' && (
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    Document
                  </span>
                </div>
              )}
              
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <h3 className="font-semibold text-secondary-900 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                
                {doc.summary && (
                  <p className="text-sm text-secondary-600 mb-3 line-clamp-3">
                    {doc.summary}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-secondary-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{doc.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(doc.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {doc.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center space-x-1 text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded"
                      >
                        <Tag className="w-2 h-2" />
                        <span>{topic}</span>
                      </span>
                    ))}
                    {doc.topics.length > 3 && (
                      <span className="text-xs text-secondary-500">
                        +{doc.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/documents/${doc.id}`)
                      }}
                      className="inline-flex items-center space-x-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>

                  </div>
                  
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center space-x-1 text-xs text-secondary-600 hover:text-secondary-700"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 