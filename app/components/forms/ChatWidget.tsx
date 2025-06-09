'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, ExternalLink, Loader2, Plus, Check, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// import { IntelligencePanel } from '../../components/IntelligencePanel' // Temporarily disabled

interface ExtractableFact {
  content: string
  confidence: number
  source_context: string
  suggested_tags: string[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  intelligence_enhancement?: IntelligenceEnhancement
  extractable_facts?: ExtractableFact[]
  timestamp: Date
}

interface Citation {
  text: string
  source_url: string
  document_title: string
  chunk_id: string
}

interface IntelligenceEnhancement {
  intelligence_summary: string
  related_concepts: string[]
  insights: Array<{
    title: string
    description: string
    confidence: number
  }>
  concept_connections: boolean
}

interface ChatWidgetProps {
  selectedThemes?: string[]
  onThemeChange?: (themes: string[]) => void
}

export default function ChatWidget({ selectedThemes = [], onThemeChange }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AIME Knowledge Assistant. I can help you find information from our research documents and answer questions based on our knowledge base. What would you like to know?',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<'openai' | 'anthropic'>('openai')
  const [savingFacts, setSavingFacts] = useState<Set<string>>(new Set())
  const [savedFacts, setSavedFacts] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const saveFactToValidation = async (fact: ExtractableFact, messageId: string, userQuery: string) => {
    const factKey = `${messageId}-${fact.content}`
    
    console.log('🔍 Attempting to save fact:', fact.content.substring(0, 50) + '...')
    
    // Prevent double-clicking by checking if already saving or saved
    if (savingFacts.has(factKey) || savedFacts.has(factKey)) {
      console.log('⚠️ Fact already saving or saved, skipping')
      return
    }
    
    setSavingFacts(prev => new Set(prev).add(factKey))

    try {
      // Create snippet for validation system
      const snippet = {
        content: fact.content,
        source: {
          document: 'AI Assistant Response',
          context: `Query: "${userQuery}" | Context: ${fact.source_context}`,
          date: new Date().toISOString()
        },
        tags: fact.suggested_tags,
        extractedFrom: 'ai_chat',
        confidence: fact.confidence
      }

      console.log('📤 Sending snippet to API:', snippet)

      // Save to validation system
      const response = await fetch('/api/validation/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet)
      })

      console.log('📡 API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ API Response data:', data)
        setSavedFacts(prev => new Set(prev).add(factKey))
        
        // Show different message for duplicates vs new facts
        if (data.isDuplicate) {
          console.log('ℹ️ Fact already exists in validation system')
          alert('This fact already exists in the validation system!')
        } else {
          console.log('🎉 Fact saved successfully for validation')
          alert('Fact saved successfully! Check the validation system to see it.')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ API Error response:', errorText)
        throw new Error(`Failed to save fact: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('💥 Error saving fact:', error)
      alert(`Error saving fact: ${error.message}`)
    } finally {
      setSavingFacts(prev => {
        const newSet = new Set(prev)
        newSet.delete(factKey)
        return newSet
      })
    }
  }

  // Smart scrolling: only when really needed
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const messagesContainer = messagesEndRef.current?.parentElement
    
    if (!messagesContainer || !lastMessage) return
    
    // Only auto-scroll when:
    // 1. There's a new assistant message (AI just responded)
    // 2. Skip the initial welcome message
    // 3. User is already near the bottom (within 100px)
    if (lastMessage?.role === 'assistant' && messages.length > 1) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      // Only scroll if user is already near the bottom
      if (isNearBottom) {
        setTimeout(() => {
          scrollToBottom()
        }, 200)
      }
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          model: selectedModel,
          history: messages.slice(-5), // Send last 5 messages for context
          selectedThemes: selectedThemes, // Include theme filtering
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        citations: data.citations,
        intelligence_enhancement: data.intelligence_enhancement,
        extractable_facts: data.extractable_facts || [],
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 h-[600px] flex flex-col w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200">
        <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-secondary-900">AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-secondary-600">Model:</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'anthropic')}
            className="text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="openai">GPT-4</option>
            <option value="anthropic">Claude</option>
          </select>
        </div>
        </div>
        
        {/* Theme Filter Indicator */}
        {selectedThemes.length > 0 && (
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-secondary-600">
                Searching {selectedThemes.length} theme{selectedThemes.length !== 1 ? 's' : ''}:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedThemes.slice(0, 3).map((theme, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                >
                  {theme}
                </span>
              ))}
              {selectedThemes.length > 3 && (
                <span className="text-xs text-secondary-500">
                  +{selectedThemes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] min-w-[200px] rounded-lg p-3 break-words overflow-hidden ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-secondary-100 text-secondary-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="w-4 h-4 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere word-break-break-word">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Intelligence Panel - Temporarily disabled */}
                  {/* {message.role === 'assistant' && message.intelligence_enhancement && (
                    <IntelligencePanel 
                      enhancement={message.intelligence_enhancement}
                      isVisible={true}
                    />
                  )} */}

                  {/* Extractable Facts */}
                  {message.role === 'assistant' && message.extractable_facts && message.extractable_facts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 bg-green-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-green-800 mb-2 flex items-center">
                        <Plus className="w-3 h-3 mr-1" />
                        Key Facts (Ready for Validation):
                      </div>
                      <div className="space-y-2">
                        {message.extractable_facts.map((fact, index) => {
                          const factKey = `${message.id}-${fact.content}`
                          const isFactSaving = savingFacts.has(factKey)
                          const isFactSaved = savedFacts.has(factKey)
                          const userQuery = messages[messages.findIndex(m => m.id === message.id) - 1]?.content || ''
                          
                          return (
                            <div
                              key={index}
                              className="text-xs bg-white rounded p-3 border border-green-200 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-green-900 mb-1">
                                  {fact.content}
                                </div>
                                <div className="text-green-700 mb-2 text-xs">
                                  Context: {fact.source_context}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {fact.suggested_tags.map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  Confidence: {Math.round(fact.confidence * 100)}%
                                </div>
                              </div>
                              
                              <div className="ml-3 flex-shrink-0">
                                {isFactSaved ? (
                                  <div className="flex items-center text-green-600">
                                    <Check className="w-4 h-4 mr-1" />
                                    <span className="text-xs">Saved</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => saveFactToValidation(fact, message.id, userQuery)}
                                    disabled={isFactSaving}
                                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs"
                                  >
                                    {isFactSaving ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Saving
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Save for Validation
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-3 text-xs text-green-700 flex items-center">
                        💡 These facts will be added to the validation system for team review
                      </div>
                    </div>
                  )}

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-secondary-200">
                      <div className="text-xs font-medium text-secondary-600 mb-2">
                        Sources:
                      </div>
                      <div className="space-y-1">
                        {message.citations.map((citation, index) => (
                          <div
                            key={index}
                            className="text-xs bg-white rounded p-2 border border-secondary-200"
                          >
                            <div className="font-medium text-secondary-800 mb-1">
                              {citation.document_title}
                            </div>
                            <div className="text-secondary-600 mb-2 line-clamp-2">
                              {citation.text}
                            </div>
                            <a
                              href={citation.source_url}
                              className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View source</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-secondary-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-secondary-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about AIME research..."
            className="flex-1 input-field"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
} 