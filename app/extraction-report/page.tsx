'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Lightbulb,
  FileText,
  MessageSquare,
  Download,
  Upload,
  Plus,
  Check,
  AlertCircle,
  Brain,
  Search
} from 'lucide-react'

interface ExtractedFact {
  content: string
  confidence: number
  source_context: string
  suggested_tags: string[]
}

export default function ExtractionReportPage() {
  const router = useRouter()
  const [reportSource, setReportSource] = useState('')
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([])
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [savedFacts, setSavedFacts] = useState<Set<string>>(new Set())
  const [reportTitle, setReportTitle] = useState('')
  const [sourceType, setSourceType] = useState<'document' | 'conversation' | 'research' | 'other'>('document')

  const generateKnowledgeReport = async () => {
    setIsGeneratingReport(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please analyze this ${sourceType} content and extract key factual statements that could be validated. Focus on specific, measurable claims about AIME's impact, programs, or outcomes: "${reportSource}"`,
          model: 'openai',
          history: []
        })
      })

      if (response.ok) {
        const data = await response.json()
        setExtractedFacts(data.extractable_facts || [])
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const addExtractedFactToValidation = async (fact: ExtractedFact) => {
    try {
      const snippet = {
        content: fact.content,
        source: {
          document: reportTitle || 'Knowledge Extraction Report',
          context: `Extracted from ${sourceType}: ${fact.source_context}`,
          date: new Date().toISOString()
        },
        tags: fact.suggested_tags,
        extractedFrom: 'extraction_report',
        confidence: fact.confidence
      }

      const response = await fetch('/api/validation/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippet)
      })

      if (response.ok) {
        setSavedFacts(prev => new Set(prev).add(fact.content))
      }
    } catch (error) {
      console.error('Error adding extracted fact:', error)
    }
  }

  const saveAllFacts = async () => {
    for (const fact of extractedFacts) {
      if (!savedFacts.has(fact.content)) {
        await addExtractedFactToValidation(fact)
      }
    }
  }

  const clearReport = () => {
    setReportSource('')
    setExtractedFacts([])
    setSavedFacts(new Set())
    setReportTitle('')
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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  Knowledge Extraction Report
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  AI-powered extraction of factual statements from documents and content
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/validation-test')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                View Validation System
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Instructions */}
        <div className="bg-purple-50 rounded-lg p-6 mb-6 border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-900 mb-3">How Knowledge Extraction Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">1</div>
              <div>
                <div className="font-medium text-purple-900">Paste Content</div>
                <div className="text-purple-700">Add documents, reports, AI conversations, or research notes</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">2</div>
              <div>
                <div className="font-medium text-purple-900">AI Analysis</div>
                <div className="text-purple-700">Our AI identifies factual statements, confidence levels, and suggests tags</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">3</div>
              <div>
                <div className="font-medium text-purple-900">Validation Ready</div>
                <div className="text-purple-700">Add selected facts to IMAGI-NATION validation system</div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Content Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title (Optional)
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., AIME Impact Report 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="document">Document/Report</option>
                <option value="conversation">AI Conversation</option>
                <option value="research">Research Notes</option>
                <option value="other">Other Content</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content to Analyze
            </label>
            <textarea
              value={reportSource}
              onChange={(e) => setReportSource(e.target.value)}
              placeholder="Paste your content here - documents, AI conversations, research notes, etc. The AI will analyze this content and extract factual statements that could be validated..."
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {reportSource.length} characters
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={generateKnowledgeReport}
              disabled={!reportSource.trim() || isGeneratingReport}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Extract Knowledge
                </>
              )}
            </button>
            
            {reportSource && (
              <button
                onClick={clearReport}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {extractedFacts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                Extracted Knowledge ({extractedFacts.length} facts found)
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={saveAllFacts}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add All to Validation
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {extractedFacts.map((fact, index) => {
                const isFactSaved = savedFacts.has(fact.content)
                
                return (
                  <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-purple-900 mb-2">
                          {fact.content}
                        </div>
                        
                        <div className="text-purple-700 mb-3 text-sm">
                          <strong>Context:</strong> {fact.source_context}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {fact.suggested_tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-purple-600">
                          <div>Confidence: {Math.round(fact.confidence * 100)}%</div>
                          <div className="flex items-center gap-1">
                            {fact.confidence >= 0.8 ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : fact.confidence >= 0.6 ? (
                              <AlertCircle className="w-3 h-3 text-yellow-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-600" />
                            )}
                            {fact.confidence >= 0.8 ? 'High' : fact.confidence >= 0.6 ? 'Medium' : 'Low'} confidence
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {isFactSaved ? (
                          <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                            <Check className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Added</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => addExtractedFactToValidation(fact)}
                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add to Validation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-purple-100 rounded-lg">
              <div className="text-sm text-purple-800">
                <strong>📊 Extraction Summary:</strong> Found {extractedFacts.length} factual statements. 
                {savedFacts.size > 0 && ` ${savedFacts.size} added to validation system.`}
                <br />
                <strong>💡 Next Step:</strong> Visit the{' '}
                <button
                  onClick={() => router.push('/validation-test')}
                  className="underline hover:no-underline font-medium"
                >
                  Validation System
                </button>{' '}
                to see how IMAGI-NATION visa holders validate these facts.
              </div>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        {extractedFacts.length === 0 && !isGeneratingReport && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">💡 Try These Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setReportSource(`AIME has supported over 18,000 Indigenous young people across Australia since its founding. The program operates in 52 universities and has achieved a 34% increase in first-year university completion rates among participants. Our mentoring approach has resulted in 89% of participants reporting increased confidence in their educational journey.`)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900 mb-2">Sample Impact Report</div>
                <div className="text-sm text-gray-600">Click to load example AIME impact statistics</div>
              </button>
              
              <button
                onClick={() => setReportSource(`In our recent AI conversation about AIME's programs, the assistant mentioned that IMAGI-NATION aims to reach 50 million young people by 2030. The conversation also highlighted that students in AIME programs show 23% higher university completion rates compared to national averages. Additionally, AIME operates across multiple countries including Australia, South Africa, and the United States.`)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900 mb-2">AI Conversation Extract</div>
                <div className="text-sm text-gray-600">Click to load example AI chat content</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 