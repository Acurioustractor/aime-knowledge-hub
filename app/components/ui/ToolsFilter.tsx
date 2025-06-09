'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Filter, Video, FileText, Volume2, Image, Wrench, Tag, MapPin } from 'lucide-react'

interface ToolsFilterProps {
  selectedFormats: string[]
  selectedAreas: string[]
  selectedTags: string[]
  onFormatChange: (formats: string[]) => void
  onAreaChange: (areas: string[]) => void
  onTagChange: (tags: string[]) => void
}

interface FilterData {
  formats: { name: string; count: number }[]
  areas: { name: string; count: number }[]
  tags: { name: string; count: number }[]
}

const formatIcons = {
  'Document': FileText,
  'Video': Video,
  'Audio': Volume2,
  'Image': Image,
  'Unknown': Wrench,
}

export default function ToolsFilter({
  selectedFormats,
  selectedAreas,
  selectedTags,
  onFormatChange,
  onAreaChange,
  onTagChange
}: ToolsFilterProps) {
  const [filterData, setFilterData] = useState<FilterData>({
    formats: [],
    areas: [],
    tags: []
  })
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    formats: true,
    areas: true,
    tags: true
  })

  useEffect(() => {
    fetchFilterData()
  }, [])

  const fetchFilterData = async () => {
    try {
      setLoading(true)
      // Get a sample of tools to calculate filter data
      const response = await fetch('/api/tools?limit=150')
      if (!response.ok) throw new Error('Failed to fetch tools')
      
      const data = await response.json()
      const tools = data.tools || []

      // Count occurrences of each filter option
      const formatCounts: Record<string, number> = {}
      const areaCounts: Record<string, number> = {}
      const tagCounts: Record<string, number> = {}

      tools.forEach((tool: any) => {
        if (tool.format) {
          formatCounts[tool.format] = (formatCounts[tool.format] || 0) + 1
        }
        if (tool.area) {
          areaCounts[tool.area] = (areaCounts[tool.area] || 0) + 1
        }
        if (tool.tags && Array.isArray(tool.tags)) {
          tool.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      setFilterData({
        formats: Object.entries(formatCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        areas: Object.entries(areaCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        tags: Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20) // Limit to top 20 tags
      })
    } catch (error) {
      console.error('Error fetching filter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleFormatToggle = (format: string) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter(f => f !== format)
      : [...selectedFormats, format]
    onFormatChange(newFormats)
  }

  const handleAreaToggle = (area: string) => {
    const newAreas = selectedAreas.includes(area)
      ? selectedAreas.filter(a => a !== area)
      : [...selectedAreas, area]
    onAreaChange(newAreas)
  }

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    onTagChange(newTags)
  }

  const clearAllFilters = () => {
    onFormatChange([])
    onAreaChange([])
    onTagChange([])
  }

  const activeFilterCount = selectedFormats.length + selectedAreas.length + selectedTags.length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-secondary-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-secondary-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-secondary-600" />
          <h3 className="font-semibold text-secondary-900">Filter Tools</h3>
          {activeFilterCount > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-secondary-500 hover:text-secondary-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Format Filter */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('formats')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-secondary-600" />
            <span className="font-medium text-secondary-900">Format</span>
            {selectedFormats.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">
                {selectedFormats.length}
              </span>
            )}
          </div>
          {expandedSections.formats ? (
            <ChevronUp className="w-4 h-4 text-secondary-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary-400" />
          )}
        </button>

        {expandedSections.formats && (
          <div className="space-y-2 pl-6">
            {filterData.formats.map(({ name, count }) => {
              const FormatIcon = formatIcons[name as keyof typeof formatIcons] || Wrench
              const isSelected = selectedFormats.includes(name)
              
              return (
                <label
                  key={name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFormatToggle(name)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <FormatIcon className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-secondary-400'}`} />
                    <span className={`text-sm ${isSelected ? 'text-primary-900 font-medium' : 'text-secondary-700'}`}>
                      {name}
                    </span>
                  </div>
                  <span className="text-xs text-secondary-500">{count}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Area Filter */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('areas')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-secondary-600" />
            <span className="font-medium text-secondary-900">Area</span>
            {selectedAreas.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">
                {selectedAreas.length}
              </span>
            )}
          </div>
          {expandedSections.areas ? (
            <ChevronUp className="w-4 h-4 text-secondary-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary-400" />
          )}
        </button>

        {expandedSections.areas && (
          <div className="space-y-2 pl-6">
            {filterData.areas.map(({ name, count }) => {
              const isSelected = selectedAreas.includes(name)
              
              return (
                <label
                  key={name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAreaToggle(name)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm ${isSelected ? 'text-primary-900 font-medium' : 'text-secondary-700'}`}>
                      {name}
                    </span>
                  </div>
                  <span className="text-xs text-secondary-500">{count}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Tags Filter */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('tags')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-secondary-600" />
            <span className="font-medium text-secondary-900">Tags</span>
            {selectedTags.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">
                {selectedTags.length}
              </span>
            )}
          </div>
          {expandedSections.tags ? (
            <ChevronUp className="w-4 h-4 text-secondary-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary-400" />
          )}
        </button>

        {expandedSections.tags && (
          <div className="space-y-2 pl-6">
            {filterData.tags.map(({ name, count }) => {
              const isSelected = selectedTags.includes(name)
              
              return (
                <label
                  key={name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleTagToggle(name)}
                      className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm ${isSelected ? 'text-primary-900 font-medium' : 'text-secondary-700'}`}>
                      {name}
                    </span>
                  </div>
                  <span className="text-xs text-secondary-500">{count}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 