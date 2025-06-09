import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Lightbulb, MessageSquare, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { IntelligencePanel } from './IntelligencePanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  intelligence_enhancement?: IntelligenceEnhancement
  timestamp: Date
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

interface DocumentChatProps {
  documentId: string
  documentTitle: string
  documentType?: string
}

// Suggested prompts based on document content
const getDocumentPrompts = (title: string, type?: string) => {
  // Base prompts that work for any document
  const basePrompts = [
    "What are the key insights from this document?",
    "Can you summarize the main points?",
    "What are the most important takeaways?"
  ]

  // Document-specific prompts based on title/content
  if (title.toLowerCase().includes('hoodie economics')) {
    return [
      "What is hoodie economics and how does it work?",
      "How does relational economics differ from traditional economics?",
      "What are the practical applications of hoodie economics?",
      "How can communities implement these economic principles?"
    ]
  } else if (title.toLowerCase().includes('business cases')) {
    return [
      "What are the most successful business models described?",
      "How do these business cases show impact measurement?",
      "What scaling strategies are recommended?",
      "What are the key success factors across these cases?"
    ]
  } else if (title.toLowerCase().includes('aime') || title.toLowerCase().includes('indigenous')) {
    return [
      "How does AIME approach indigenous knowledge integration?",
      "What methodologies does AIME use for community engagement?",
      "How does AIME measure success and impact?",
      "What are the cultural protocols mentioned?"
    ]
  } else if (title.toLowerCase().includes('nation')) {
    return [
      "What was discussed in this NATION tour?",
      "What are the key messages for communities?",
      "How does this connect to AIME's broader mission?",
      "What action items were identified?"
    ]
  }

  return basePrompts
}

export default function DocumentChat({ documentId, documentTitle, documentType }: DocumentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showPrompts, setShowPrompts] = useState(true)

  const suggestedPrompts = getDocumentPrompts(documentTitle, documentType)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Smart scrolling: only when assistant responds
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const messagesContainer = messagesEndRef.current?.parentElement
    
    if (!messagesContainer || !lastMessage) return
    
    // Only auto-scroll when:
    // 1. There's a new assistant message (AI just responded)
    // 2. Skip the initial welcome message
    // 3. User is already near the bottom (within 100px)
    if (lastMessage?.role === 'assistant' && messages.length > 1) {
      const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100
      
      if (isNearBottom) {
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI assistant for **${documentTitle}**. I can help you explore this specific document in depth. Try one of the suggested questions below or ask me anything about this document!`,
      timestamp: new Date(),
    }])
  }, [documentTitle])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    setShowPrompts(false) // Hide prompts after first message
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          model: 'anthropic',
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          document_id: documentId, // NEW: limit search to this document
          enable_intelligence: true
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
        intelligence_enhancement: data.intelligence_enhancement,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Document Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Ask questions about "{documentTitle}"
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            <div
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex items-start space-x-3 max-w-[85%]">
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`min-w-[200px] rounded-lg p-3 break-words ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none break-words overflow-wrap-anywhere">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Intelligence Panel */}
            {message.role === 'assistant' && message.intelligence_enhancement && (
              <div className="ml-11">
                <IntelligencePanel 
                  enhancement={message.intelligence_enhancement} 
                />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {showPrompts && messages.length <= 1 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              Suggested questions:
            </span>
          </div>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700 border border-transparent hover:border-gray-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about this document..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
} 