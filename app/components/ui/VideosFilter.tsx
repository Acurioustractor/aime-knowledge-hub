'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Filter, Youtube, Video as VideoIcon, Wrench, Calendar, Tag as TagIcon, MapPin } from 'lucide-react'

interface VideosFilterProps {
  selectedSources: string[]
  selectedYears: string[]
  selectedAreas: string[]
  selectedTags: string[]
  onSourceChange: (sources: string[]) => void
  onYearChange: (years: string[]) => void
  onAreaChange: (areas: string[]) => void
  onTagChange: (tags: string[]) => void
}

export default function VideosFilter({
  selectedSources,
  selectedYears,
  selectedAreas,
  selectedTags,
  onSourceChange,
  onYearChange,
  onAreaChange,
  onTagChange
}: VideosFilterProps) {
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableAreas, setAvailableAreas] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [videoCounts, setVideoCounts] = useState<{[key: string]: number}>({})
  const [loading, setLoading] = useState(true)
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState({
    source: true,
    year: true,
    area: true,
    tags: true
  })

  useEffect(() => {
    fetchVideoMetadata()
  }, [])

  const fetchVideoMetadata = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/videos')
      const data = await response.json()
      
      if (data.videos) {
        // Extract years from video dates
        const years = new Set<string>()
        const areas = new Set<string>()
        const tags = new Set<string>()
        const sources = { youtube: 0, vimeo: 0, tools: 0 }

        data.videos.forEach((video: any) => {
          // Count by source
          const source = video.source || 'unknown'
          if (source === 'youtube') sources.youtube++
          else if (source === 'vimeo') sources.vimeo++
          else if (source === 'tools') sources.tools++

          // Extract year from various date fields
          const dateString = video.createdTime || video.publishedAt || video.date
          if (dateString) {
            const year = new Date(dateString).getFullYear().toString()
            if (!isNaN(parseInt(year)) && parseInt(year) > 2000) {
              years.add(year)
            }
          }

          // Extract areas (mainly from tools videos)
          if (video.area && video.area.trim()) {
            areas.add(video.area.trim())
          }

          // Extract tags (mainly from tools videos)
          if (video.tags && Array.isArray(video.tags)) {
            video.tags.forEach((tag: string) => {
              if (tag && tag.trim()) {
                tags.add(tag.trim())
              }
            })
          }
        })

        setAvailableYears(Array.from(years).sort().reverse())
        setAvailableAreas(Array.from(areas).sort())
        setAvailableTags(Array.from(tags).sort())
        setVideoCounts(sources)
      }
    } catch (error) {
      console.error('Error fetching video metadata:', error)
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

  const handleSourceToggle = (source: string) => {
    const newSources = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source]
    onSourceChange(newSources)
  }

  const handleYearToggle = (year: string) => {
    const newYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year]
    onYearChange(newYears)
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
    onSourceChange([])
    onYearChange([])
    onAreaChange([])
    onTagChange([])
  }

  const FilterSection = ({ 
    title, 
    icon: Icon, 
    isExpanded, 
    onToggle, 
    children 
  }: { 
    title: string
    icon: any
    isExpanded: boolean
    onToggle: () => void
    children: React.ReactNode 
  }) => (
    <div className="border-b border-secondary-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-secondary-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-secondary-500" />
          <span className="font-medium text-secondary-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-secondary-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-secondary-500" />
        )}
      </button>
      {isExpanded && (
        <div className="pb-3 px-4">
          {children}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-secondary-500" />
          <h2 className="text-lg font-semibold text-secondary-900">Filter Videos</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-secondary-200 rounded"></div>
          <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
          <div className="h-4 bg-secondary-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const hasActiveFilters = selectedSources.length > 0 || selectedYears.length > 0 || 
                          selectedAreas.length > 0 || selectedTags.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
      {/* Header */}
      <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary-500" />
            <h2 className="text-lg font-semibold text-secondary-900">Filter Videos</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Video Source Filter */}
      <FilterSection
        title="Source"
        icon={VideoIcon}
        isExpanded={expandedSections.source}
        onToggle={() => toggleSection('source')}
      >
        <div className="space-y-2">
          {[
            { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', count: videoCounts.youtube },
            { key: 'vimeo', label: 'Vimeo', icon: VideoIcon, color: 'text-blue-600', count: videoCounts.vimeo },
            { key: 'tools', label: 'Video Tools', icon: Wrench, color: 'text-green-600', count: videoCounts.tools }
          ].map(({ key, label, icon: SourceIcon, color, count }) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer hover:bg-secondary-50 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedSources.includes(key)}
                onChange={() => handleSourceToggle(key)}
                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <SourceIcon className={`w-4 h-4 ${color}`} />
              <span className="text-sm text-secondary-700 flex-1">{label}</span>
              <span className="text-xs text-secondary-500">({count || 0})</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Year Filter */}
      {availableYears.length > 0 && (
        <FilterSection
          title="Year"
          icon={Calendar}
          isExpanded={expandedSections.year}
          onToggle={() => toggleSection('year')}
        >
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availableYears.map(year => (
              <label key={year} className="flex items-center space-x-2 cursor-pointer hover:bg-secondary-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(year)}
                  onChange={() => handleYearToggle(year)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">{year}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Area Filter */}
      {availableAreas.length > 0 && (
        <FilterSection
          title="Area"
          icon={MapPin}
          isExpanded={expandedSections.area}
          onToggle={() => toggleSection('area')}
        >
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availableAreas.map(area => (
              <label key={area} className="flex items-center space-x-2 cursor-pointer hover:bg-secondary-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedAreas.includes(area)}
                  onChange={() => handleAreaToggle(area)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">{area}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <FilterSection
          title="Tags"
          icon={TagIcon}
          isExpanded={expandedSections.tags}
          onToggle={() => toggleSection('tags')}
        >
          <div className="max-h-32 overflow-y-auto space-y-1">
            {availableTags.slice(0, 20).map(tag => (
              <label key={tag} className="flex items-center space-x-2 cursor-pointer hover:bg-secondary-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">{tag}</span>
              </label>
            ))}
            {availableTags.length > 20 && (
              <div className="text-xs text-secondary-500 pt-1">
                And {availableTags.length - 20} more...
              </div>
            )}
          </div>
        </FilterSection>
      )}
    </div>
  )
} 