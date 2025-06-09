'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Brain, 
  Lightbulb, 
  Network, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from 'lucide-react'

interface IntelligenceInsight {
  title: string
  description: string
  confidence: number
}

interface IntelligenceEnhancement {
  intelligence_summary: string
  related_concepts: string[]
  insights: IntelligenceInsight[]
  concept_connections: boolean
}

interface IntelligencePanelProps {
  enhancement: IntelligenceEnhancement | null
  isVisible?: boolean
}

export function IntelligencePanel({ enhancement, isVisible = true }: IntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!enhancement || !isVisible) {
    return null
  }

  return (
    <Card className="mt-4 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 w-full max-w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <Brain className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-medium text-blue-900">
              Intelligence Enhancement
            </CardTitle>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Insights
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Intelligence Summary */}
          {enhancement.intelligence_summary && (
            <div className="p-3 rounded-lg bg-white/50 border border-blue-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Smart Summary</h4>
                  <p className="text-sm text-gray-700">{enhancement.intelligence_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Related Concepts */}
          {enhancement.related_concepts && enhancement.related_concepts.length > 0 && (
            <div className="p-3 rounded-lg bg-white/50 border border-blue-100">
              <div className="flex items-start gap-2">
                <Network className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Related Concepts</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {enhancement.related_concepts.map((concept, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer"
                      >
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights */}
          {enhancement.insights && enhancement.insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <h4 className="text-sm font-medium text-gray-900">Key Insights</h4>
              </div>
              {enhancement.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-white/50 border border-purple-100 hover:bg-purple-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900 mb-1">
                        {insight.title}
                      </h5>
                      <p className="text-sm text-gray-700">{insight.description}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-purple-100 text-purple-700 flex-shrink-0"
                    >
                      {Math.round(insight.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Concept Connections Indicator */}
          {enhancement.concept_connections && (
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
              <Network className="h-3 w-3" />
              <span>This query has been enhanced with concept relationship mapping</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Optional: Intelligence Dashboard Component
export function IntelligenceDashboard() {
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadSystemInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_insights' })
      })
      
      if (response.ok) {
        const result = await response.json()
        setInsights(result.insights || [])
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadSystemInsights()
  }, [])

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Knowledge Intelligence Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {insight.concept_count} concepts
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {Math.round(insight.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 