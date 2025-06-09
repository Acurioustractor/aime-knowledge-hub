'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Loader2, FileText, Presentation, ClipboardList, Download, Eye } from 'lucide-react'

interface Theme {
  id: string
  name: string
  count: number
}

interface GeneratedDocument {
  type: string
  title: string
  sections: Array<{
    id: number
    title: string
    content: string
    order: number
  }>
  word_count: number
  generated_at: string
}

interface DocumentMetadata {
  type: string
  audience: string
  themes_used: number
  sources_referenced: number
  generated_at: string
}

export default function DocumentGenerator() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null)
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    type: 'pitch_deck',
    audience: '',
    purpose: '',
    length: 'medium',
    tone: 'professional'
  })

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setThemes(data.slice(0, 20)) // Top 20 themes
      } else if (data.themes && Array.isArray(data.themes)) {
        setThemes(data.themes.slice(0, 20)) // Top 20 themes
      } else {
        console.error('Unexpected themes data format:', data)
        setThemes([])
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error)
    }
  }

  const handleThemeToggle = (themeName: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeName) 
        ? prev.filter(t => t !== themeName)
        : [...prev, themeName]
    )
  }

  const generateDocument = async () => {
    if (!formData.audience || !formData.purpose || selectedThemes.length === 0) {
      alert('Please fill in all required fields and select at least one theme')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          focus_themes: selectedThemes
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setGeneratedDoc(result.document)
        setMetadata(result.metadata)
      } else {
        alert('Failed to generate document: ' + result.error)
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('Failed to generate document')
    } finally {
      setLoading(false)
    }
  }

  const exportDocument = () => {
    if (!generatedDoc) return

    const content = generatedDoc.sections.map(section => 
      `${section.title}\n\n${section.content}\n\n`
    ).join('')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedDoc.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pitch_deck': return <Presentation className="w-4 h-4" />
      case 'proposal': return <ClipboardList className="w-4 h-4" />
      case 'report': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AIME Document Generator</h1>
        <p className="text-lg text-gray-600">
          Create compelling pitch decks, proposals, and reports using AIME's knowledge base
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Type */}
              <div>
                <Label>Document Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pitch_deck">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4" />
                        Pitch Deck
                      </div>
                    </SelectItem>
                    <SelectItem value="proposal">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Project Proposal
                      </div>
                    </SelectItem>
                    <SelectItem value="report">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Impact Report
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div>
                <Label>Target Audience *</Label>
                <Input 
                  placeholder="e.g., Corporate funders, Government agencies, Universities"
                  value={formData.audience}
                  onChange={(e) => setFormData({...formData, audience: e.target.value})}
                />
              </div>

              {/* Purpose */}
              <div>
                <Label>Purpose *</Label>
                <Textarea 
                  placeholder="Describe the specific purpose and objectives..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Length */}
              <div>
                <Label>Length</Label>
                <Select value={formData.length} onValueChange={(value) => setFormData({...formData, length: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (2-3 pages)</SelectItem>
                    <SelectItem value="medium">Medium (5-8 pages)</SelectItem>
                    <SelectItem value="long">Long (10+ pages)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div>
                <Label>Tone</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({...formData, tone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Themes ({selectedThemes.length} selected)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {themes.length === 0 ? (
                  <div className="text-gray-500 text-sm">Loading themes...</div>
                ) : (
                  themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-2 rounded cursor-pointer border transition-colors ${
                        selectedThemes.includes(theme.name)
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleThemeToggle(theme.name)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{theme.name}</span>
                        <Badge variant="secondary">{theme.count}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button 
            onClick={generateDocument}
            disabled={loading || !formData.audience || !formData.purpose || selectedThemes.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {getTypeIcon(formData.type)}
                <span className="ml-2">Generate Document</span>
              </>
            )}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {generatedDoc ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(generatedDoc.type)}
                      {generatedDoc.title}
                    </CardTitle>
                    {metadata && (
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Audience: {metadata.audience}</span>
                        <span>Themes: {metadata.themes_used}</span>
                        <span>Sources: {metadata.sources_referenced}</span>
                        <span>Words: {generatedDoc.word_count}</span>
                      </div>
                    )}
                  </div>
                  <Button onClick={exportDocument} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {generatedDoc.sections.map((section) => (
                    <div key={section.id} className="border-l-4 border-blue-200 pl-4">
                      <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {section.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-96 text-gray-500">
                <FileText className="w-16 h-16 mb-4" />
                <p>Configure your document and click "Generate" to create content</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 