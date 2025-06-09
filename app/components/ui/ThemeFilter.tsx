'use client'

import { useState, useEffect } from 'react'
import { Tag, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Theme {
  id: string
  name: string
  description?: string
  count: number
}

interface ThemeFilterProps {
  selectedThemes: string[]
  onThemeChange: (themes: string[]) => void
}

export default function ThemeFilter({ selectedThemes, onThemeChange }: ThemeFilterProps) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/themes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch themes')
      }
      
      const data = await response.json()
      // Handle both array response and object with themes property
      if (Array.isArray(data)) {
        setThemes(data)
      } else if (data.themes && Array.isArray(data.themes)) {
        setThemes(data.themes)
      } else {
        console.error('Unexpected themes data format:', data)
        throw new Error('Invalid themes data format')
      }
    } catch (err) {
      console.error('Error fetching themes:', err)
      // Mock data for development
      setThemes([
        { id: '1', name: 'AI Ethics', description: 'Ethical considerations in AI development', count: 12 },
        { id: '2', name: 'Healthcare', description: 'AI applications in healthcare', count: 8 },
        { id: '3', name: 'Machine Learning', description: 'ML algorithms and techniques', count: 15 },
        { id: '4', name: 'Climate Science', description: 'AI for climate research', count: 6 },
        { id: '5', name: 'Future of Work', description: 'Impact of AI on employment', count: 9 },
        { id: '6', name: 'Human-AI Collaboration', description: 'Human-AI interaction patterns', count: 7 },
        { id: '7', name: 'Research', description: 'General research methodologies', count: 11 },
        { id: '8', name: 'Framework', description: 'Conceptual frameworks and models', count: 5 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleThemeToggle = (themeName: string) => {
    if (selectedThemes.includes(themeName)) {
      onThemeChange(selectedThemes.filter(t => t !== themeName))
    } else {
      onThemeChange([...selectedThemes, themeName])
    }
  }

  const clearAllThemes = () => {
    onThemeChange([])
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-secondary-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-3 bg-secondary-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-secondary-900">Filter by Theme</h3>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-secondary-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary-400" />
          )}
        </button>
        
        {selectedThemes.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-secondary-600">
              {selectedThemes.length} theme{selectedThemes.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAllThemes}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Theme List */}
      {expanded && (
        <div className="p-4">
          {selectedThemes.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-secondary-600 mb-2">Selected:</div>
              <div className="flex flex-wrap gap-1">
                {selectedThemes.map((theme) => (
                  <span
                    key={theme}
                    className="inline-flex items-center space-x-1 bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded"
                  >
                    <span>{theme}</span>
                    <button
                      onClick={() => handleThemeToggle(theme)}
                      className="hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {themes
              .filter(theme => !selectedThemes.includes(theme.name))
              .sort((a, b) => b.count - a.count)
              .map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeToggle(theme.name)}
                  className="w-full text-left p-2 rounded hover:bg-secondary-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-secondary-900 group-hover:text-primary-600">
                        {theme.name}
                      </div>
                      {theme.description && (
                        <div className="text-xs text-secondary-500 mt-0.5 line-clamp-2">
                          {theme.description}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex items-center space-x-2">
                      <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-1 rounded">
                        {theme.count}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          {themes.length === 0 && (
            <div className="text-center py-4">
              <Tag className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
              <div className="text-sm text-secondary-500">No themes available</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 