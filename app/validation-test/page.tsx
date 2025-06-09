'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Share2, 
  Eye,
  Heart,
  MessageCircle,
  AlertCircle,
  Users,
  Send,
  Crown,
  Globe,
  Leaf,
  Microscope,
  Lightbulb
} from 'lucide-react'

// Updated interface with comments
interface Comment {
  id: string
  content: string
  author: string
  role: 'presidents' | 'citizens' | 'custodians' | 'iksl' | 'imagi_labs'
  timestamp: Date
}

interface Snippet {
  id: string
  content: string
  source: {
    document: string
    page?: number
    context?: string
  }
  tags: string[]
  validations: {
    presidents: { affirms: number; questions: number; needs_context: number }
    citizens: { affirms: number; questions: number; needs_context: number }
    custodians: { affirms: number; questions: number; needs_context: number }
    iksl: { affirms: number; questions: number; needs_context: number }
    imagi_labs: { affirms: number; questions: number; needs_context: number }
  }
  comments: Comment[]
  status: 'draft' | 'in_review' | 'validated' | 'contested'
  createdAt: Date
}

interface UserVote {
  snippetId: string
  type: 'presidents' | 'citizens' | 'custodians' | 'iksl' | 'imagi_labs'
  vote: 'affirms' | 'questions' | 'needs_context'
}

// Simulated current user (in real app, this would come from auth)
const currentUser = {
  name: 'Jordan Thompson',
  role: 'citizens' as const,
  id: 'user-123'
}

export default function ValidationTestPage() {
  const router = useRouter()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [userVotes, setUserVotes] = useState<Record<string, UserVote>>({})
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [comments, setComments] = useState<Record<string, string>>({}) // Track comment input for each snippet
  const [newSnippet, setNewSnippet] = useState({
    content: '',
    source: { document: '', page: 1, context: '' },
    tags: ''
  })


  useEffect(() => {
    loadSampleData()
    loadAIGeneratedSnippets()
  }, [])

  const loadAIGeneratedSnippets = async () => {
    try {
      const response = await fetch('/api/validation/snippets')
      if (response.ok) {
        const data = await response.json()
        if (data.snippets && data.snippets.length > 0) {
          const convertedSnippets = data.snippets.map((snippet: any) => ({
            ...snippet,
            validations: {
              presidents: { affirms: snippet.validations?.staff?.positive || 0, questions: snippet.validations?.staff?.negative || 0, needs_context: 0 },
              citizens: { affirms: snippet.validations?.community?.positive || 0, questions: snippet.validations?.community?.negative || 0, needs_context: 0 },
              custodians: { affirms: snippet.validations?.elders?.positive || 0, questions: snippet.validations?.elders?.negative || 0, needs_context: 0 },
              iksl: { affirms: 0, questions: 0, needs_context: 0 },
              imagi_labs: { affirms: 0, questions: 0, needs_context: 0 }
            },
            comments: snippet.comments || [],
            createdAt: new Date(snippet.createdAt)
          }))
          setSnippets(prev => [...convertedSnippets, ...prev])
        }
      }
    } catch (error) {
      console.error('Error loading AI snippets:', error)
    }
  }

  const loadSampleData = () => {
    const sampleSnippets: Snippet[] = [
      {
        id: '1',
        content: 'AIME has supported over 18,000 Indigenous young people across Australia since its founding.',
        source: { document: 'AIME Impact Report 2023', page: 5, context: 'Annual statistics summary' },
        tags: ['impact', 'numbers', 'australia', 'youth'],
        validations: {
          presidents: { affirms: 4, questions: 0, needs_context: 1 },
          citizens: { affirms: 8, questions: 1, needs_context: 2 },
          custodians: { affirms: 3, questions: 0, needs_context: 1 },
          iksl: { affirms: 2, questions: 0, needs_context: 0 },
          imagi_labs: { affirms: 1, questions: 1, needs_context: 0 }
        },
        comments: [
          {
            id: 'c1',
            content: 'This aligns with our work in systemic leadership development. The scale of impact demonstrates the potential for system change.',
            author: 'Maria Santos',
            role: 'presidents',
            timestamp: new Date('2024-01-10T10:30:00')
          },
          {
            id: 'c2',
            content: 'From a community perspective, this shows the power of relational approaches to education.',
            author: 'David Chen',
            role: 'citizens',
            timestamp: new Date('2024-01-10T14:15:00')
          },
          {
            id: 'c3',
            content: 'Important to consider the environmental and cultural contexts in which this mentoring takes place.',
            author: 'Sarah Williams',
            role: 'custodians',
            timestamp: new Date('2024-01-10T16:20:00')
          }
        ],
        status: 'validated',
        createdAt: new Date('2024-01-10T09:00:00')
      }
    ]
    setSnippets(sampleSnippets)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-green-50 border-green-200 text-green-800'
      case 'contested': return 'bg-red-50 border-red-200 text-red-800'
      case 'in_review': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return '✅'
      case 'contested': return '⚠️'
      case 'in_review': return '🔍'
      default: return '📝'
    }
  }

  const getValidationStrength = (snippet: Snippet) => {
    const totalVotes = Object.values(snippet.validations).reduce((sum, validation) => 
      sum + validation.affirms + validation.questions + validation.needs_context, 0
    )
    const positiveVotes = Object.values(snippet.validations).reduce((sum, validation) => 
      sum + validation.affirms, 0
    )
    return totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0
  }

  const handleVote = (snippetId: string, voterType: 'presidents' | 'citizens' | 'custodians' | 'iksl' | 'imagi_labs', vote: 'affirms' | 'questions' | 'needs_context') => {
    setUserVotes(prev => ({ ...prev, [snippetId]: { snippetId, type: voterType, vote } }))
    
    setSnippets(prev => prev.map(snippet => {
      if (snippet.id === snippetId) {
        return {
          ...snippet,
          validations: {
            ...snippet.validations,
            [voterType]: {
              ...snippet.validations[voterType],
              [vote]: snippet.validations[voterType][vote] + 1
            }
          }
        }
      }
      return snippet
    }))
  }

  const addComment = (snippetId: string) => {
    const commentText = comments[snippetId]?.trim()
    if (!commentText) return

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      author: currentUser.name,
      role: currentUser.role,
      timestamp: new Date()
    }

    setSnippets(prev => prev.map(snippet => {
      if (snippet.id === snippetId) {
        return {
          ...snippet,
          comments: [...snippet.comments, newComment]
        }
      }
      return snippet
    }))

    setComments(prev => ({ ...prev, [snippetId]: '' }))
  }

  const createSnippet = () => {
    const snippet: Snippet = {
      id: Date.now().toString(),
      content: newSnippet.content,
      source: newSnippet.source,
      tags: newSnippet.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      validations: {
        presidents: { affirms: 0, questions: 0, needs_context: 0 },
        citizens: { affirms: 0, questions: 0, needs_context: 0 },
        custodians: { affirms: 0, questions: 0, needs_context: 0 },
        iksl: { affirms: 0, questions: 0, needs_context: 0 },
        imagi_labs: { affirms: 0, questions: 0, needs_context: 0 }
      },
      comments: [],
      status: 'draft',
      createdAt: new Date()
    }
    
    setSnippets(prev => [snippet, ...prev])
    setNewSnippet({ content: '', source: { document: '', page: 1, context: '' }, tags: '' })
    setShowCreateForm(false)
  }



  const getVoteButtonStyle = (voteType: string, userVote?: UserVote, currentVoteType?: string) => {
    const isSelected = userVote?.vote === currentVoteType
    const baseStyle = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
    
    if (isSelected) {
      switch (currentVoteType) {
        case 'affirms': return `${baseStyle} bg-green-100 text-green-700 ring-2 ring-green-300`
        case 'questions': return `${baseStyle} bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300`
        case 'needs_context': return `${baseStyle} bg-blue-100 text-blue-700 ring-2 ring-blue-300`
      }
    }
    
    return `${baseStyle} bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200`
  }

  const getVisaIcon = (visa: string) => {
    switch (visa) {
      case 'presidents': return <Crown className="w-4 h-4" />
      case 'citizens': return <Globe className="w-4 h-4" />
      case 'custodians': return <Leaf className="w-4 h-4" />
      case 'iksl': return <Microscope className="w-4 h-4" />
      case 'imagi_labs': return <Lightbulb className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getVisaColor = (visa: string) => {
    switch (visa) {
      case 'presidents': return 'text-purple-600'
      case 'citizens': return 'text-blue-600'
      case 'custodians': return 'text-green-600'
      case 'iksl': return 'text-orange-600'
      case 'imagi_labs': return 'text-pink-600'
      default: return 'text-gray-600'
    }
  }

  const getVisaBadgeColor = (visa: string) => {
    switch (visa) {
      case 'presidents': return 'bg-purple-100 text-purple-700'
      case 'citizens': return 'bg-blue-100 text-blue-700'
      case 'custodians': return 'bg-green-100 text-green-700'
      case 'iksl': return 'bg-orange-100 text-orange-700'
      case 'imagi_labs': return 'bg-pink-100 text-pink-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Knowledge Hub
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🏛️ IMAGI-NATION Knowledge Commons
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Multi-perspective validation through IMAGI-NATION visa holders
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {getVisaIcon(currentUser.role)}
                  {currentUser.name}
                </div>
                <div className={`text-xs font-medium capitalize ${getVisaColor(currentUser.role)}`}>
                  {currentUser.role === 'imagi_labs' ? 'IMAGI-Labs' : currentUser.role} visa
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/extraction-report')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Extraction Reporting
                </button>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Snippet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">IMAGI-NATION Visa Validation Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="font-medium">Presidents</h3>
              <p className="text-xs text-gray-600">Systemic leadership & climate action</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-medium">Citizens</h3>
              <p className="text-xs text-gray-600">Collaborative relational economics</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-medium">Custodians</h3>
              <p className="text-xs text-gray-600">Environmental stewardship</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Microscope className="w-6 h-6" />
              </div>
              <h3 className="font-medium">IKSL</h3>
              <p className="text-xs text-gray-600">Indigenous Knowledge Systems</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-medium">IMAGI-Labs</h3>
              <p className="text-xs text-gray-600">Innovation & experimentation</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Validation Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-600" />
                <span className="font-medium">Affirms:</span>
                <span className="text-gray-600">I stand with this knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium">Questions:</span>
                <span className="text-gray-600">I have concerns about this</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Needs Context:</span>
                <span className="text-gray-600">We need more background</span>
              </div>
            </div>
          </div>
        </div>



        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Create Knowledge Snippet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Knowledge Statement
                </label>
                <textarea
                  value={newSnippet.content}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter a factual statement about AIME's work or impact..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Document
                  </label>
                  <input
                    type="text"
                    value={newSnippet.source.document}
                    onChange={(e) => setNewSnippet(prev => ({ 
                      ...prev, 
                      source: { ...prev.source, document: e.target.value }
                    }))}
                    placeholder="Report name, document title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Number
                  </label>
                  <input
                    type="number"
                    value={newSnippet.source.page}
                    onChange={(e) => setNewSnippet(prev => ({ 
                      ...prev, 
                      source: { ...prev.source, page: parseInt(e.target.value) || 1 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newSnippet.tags}
                    onChange={(e) => setNewSnippet(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="impact, education, metrics"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={createSnippet}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Snippet
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snippets */}
        <div className="space-y-6">
          {snippets.map((snippet) => {
            const validationStrength = getValidationStrength(snippet)
            const userVote = userVotes[snippet.id]
            
            return (
              <div key={snippet.id} className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getStatusIcon(snippet.status)}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(snippet.status)}`}>
                          {snippet.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${validationStrength}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {validationStrength}% consensus
                        </span>
                      </div>
                      
                      <p className="text-lg text-gray-900 mb-3">
                        {snippet.content}
                      </p>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <span className="font-medium">Source:</span> {snippet.source.document}
                        {snippet.source.page && ` | Page ${snippet.source.page}`}
                        {snippet.source.context && ` | ${snippet.source.context}`}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {snippet.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Validation Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                    {Object.entries(snippet.validations).map(([visaType, validation]) => (
                      <div key={visaType} className="text-center">
                        <div className={`font-semibold flex items-center justify-center gap-1 ${getVisaColor(visaType)}`}>
                          {getVisaIcon(visaType)}
                          <span className="text-xs">
                            {visaType === 'imagi_labs' ? 'IMAGI-Labs' : visaType.charAt(0).toUpperCase() + visaType.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mt-1">
                          <div>💚 {validation.affirms}</div>
                          <div>💛 {validation.questions}</div>
                          <div>💙 {validation.needs_context}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments Section */}
                  {snippet.comments.length > 0 && (
                    <div className="mb-4 border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        IMAGI-NATION Discussion ({snippet.comments.length})
                      </h4>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {snippet.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getVisaBadgeColor(comment.role)}`}>
                                  {getVisaIcon(comment.role)}
                                  {comment.role === 'imagi_labs' ? 'IMAGI-Labs' : comment.role}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {comment.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="mb-4 border-t pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add your thoughts to the IMAGI-NATION discussion..."
                        value={comments[snippet.id] || ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [snippet.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && addComment(snippet.id)}
                      />
                      <button
                        onClick={() => addComment(snippet.id)}
                        disabled={!comments[snippet.id]?.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Voting Interface */}
                  <div className="border-t pt-4">
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        How do you relate to this knowledge? (Vote as 
                        <span className={`font-medium ${getVisaColor(currentUser.role)} flex items-center gap-1`}>
                          {getVisaIcon(currentUser.role)}
                          {currentUser.role === 'imagi_labs' ? 'IMAGI-Labs' : currentUser.role}
                        </span>
                        ):
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleVote(snippet.id, currentUser.role, 'affirms')}
                          disabled={userVote?.type === currentUser.role}
                          className={getVoteButtonStyle('affirms', userVote, 'affirms')}
                        >
                          <Heart className="w-4 h-4" />
                          I Affirm This
                        </button>
                        <button
                          onClick={() => handleVote(snippet.id, currentUser.role, 'questions')}
                          disabled={userVote?.type === currentUser.role}
                          className={getVoteButtonStyle('questions', userVote, 'questions')}
                        >
                          <AlertCircle className="w-4 h-4" />
                          I Question This
                        </button>
                        <button
                          onClick={() => handleVote(snippet.id, currentUser.role, 'needs_context')}
                          disabled={userVote?.type === currentUser.role}
                          className={getVoteButtonStyle('needs_context', userVote, 'needs_context')}
                        >
                          <Users className="w-4 h-4" />
                          Needs More Context
                        </button>
                      </div>
                    </div>
                    
                    {userVote && userVote.type === currentUser.role && (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        ✓ You {userVote.vote.replace('_', ' ')} this knowledge
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Next Steps for Full IMAGI-NATION System</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <FileText className="w-8 h-8 text-blue-500 mb-2" />
              <h4 className="font-medium mb-2">AI Integration</h4>
              <p className="text-sm text-gray-600">
                Extract snippets automatically from AI responses and documents
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Share2 className="w-8 h-8 text-green-500 mb-2" />
              <h4 className="font-medium mb-2">Smart Bookmarks</h4>
              <p className="text-sm text-gray-600">
                Save and share query patterns for quick access to validated knowledge
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Eye className="w-8 h-8 text-purple-500 mb-2" />
              <h4 className="font-medium mb-2">Export Integration</h4>
              <p className="text-sm text-gray-600">
                Use validated snippets in presentations and business cases
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 