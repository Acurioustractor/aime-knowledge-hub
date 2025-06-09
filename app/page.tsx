'use client'

import { useState } from 'react'
import { Search, MessageCircle, FileText, Tag, ExternalLink, Presentation, Wrench, Mail, Video } from 'lucide-react'
import ChatWidget from './components/forms/ChatWidget'
import DocumentBrowser from './components/data/DocumentBrowser'
import DocumentGenerator from './components/forms/DocumentGenerator'
import ToolsBrowser from './components/data/ToolsBrowser'
import MailoutsBrowser from './components/data/MailoutsBrowser'
import VideosBrowser from './components/data/VideosBrowser'
import VideosFilter from './components/ui/VideosFilter'
import ThemeFilter from './components/ui/ThemeFilter'
import ToolsFilter from './components/ui/ToolsFilter'
import MailoutsFilter from './components/ui/MailoutsFilter'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'tools' | 'mailouts' | 'videos' | 'chat' | 'generate'>('browse')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // Tools filter states
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Mailouts filter states
  const [selectedMailoutStatuses, setSelectedMailoutStatuses] = useState<string[]>([])

  // Videos filter states
  const [selectedVideoSources, setSelectedVideoSources] = useState<string[]>([])
  const [selectedVideoYears, setSelectedVideoYears] = useState<string[]>([])
  const [selectedVideoAreas, setSelectedVideoAreas] = useState<string[]>([])
  const [selectedVideoTags, setSelectedVideoTags] = useState<string[]>([])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  AIME Knowledge Hub
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-secondary-200">
            <button
              onClick={() => setActiveTab('browse')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'browse'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Browse Documents</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tools'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4" />
                <span>Tools Hub</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('mailouts')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mailouts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Mailouts</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'videos'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4" />
                <span>Videos</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>AI Assistant</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'generate'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Presentation className="w-4 h-4" />
                <span>Generate Content</span>
              </div>
            </button>
            <button
              onClick={() => window.location.href = '/validation-test'}
              className="pb-4 px-1 border-b-2 border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300 font-medium text-sm transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
                <span>Test Validation</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Conditional Filter */}
          <div className="lg:col-span-1">
            {activeTab === 'tools' ? (
              <ToolsFilter
                selectedFormats={selectedFormats}
                selectedAreas={selectedAreas}
                selectedTags={selectedTags}
                onFormatChange={setSelectedFormats}
                onAreaChange={setSelectedAreas}
                onTagChange={setSelectedTags}
              />
            ) : activeTab === 'mailouts' ? (
              <MailoutsFilter
                selectedStatuses={selectedMailoutStatuses}
                onStatusChange={setSelectedMailoutStatuses}
              />
            ) : activeTab === 'videos' ? (
              <VideosFilter
                selectedSources={selectedVideoSources}
                selectedYears={selectedVideoYears}
                selectedAreas={selectedVideoAreas}
                selectedTags={selectedVideoTags}
                onSourceChange={setSelectedVideoSources}
                onYearChange={setSelectedVideoYears}
                onAreaChange={setSelectedVideoAreas}
                onTagChange={setSelectedVideoTags}
              />
            ) : (
              <ThemeFilter
                selectedThemes={selectedThemes}
                onThemeChange={setSelectedThemes}
              />
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'browse' ? (
              <DocumentBrowser
                searchQuery={searchQuery}
                selectedThemes={selectedThemes}
              />
            ) : activeTab === 'tools' ? (
              <ToolsBrowser
                searchQuery={searchQuery}
                selectedFormats={selectedFormats}
                selectedAreas={selectedAreas}
                selectedTags={selectedTags}
              />
            ) : activeTab === 'mailouts' ? (
              <MailoutsBrowser
                searchQuery={searchQuery}
                selectedStatuses={selectedMailoutStatuses}
              />
            ) : activeTab === 'videos' ? (
              <VideosBrowser
                searchQuery={searchQuery}
                selectedSources={selectedVideoSources}
                selectedYears={selectedVideoYears}
                selectedAreas={selectedVideoAreas}
                selectedTags={selectedVideoTags}
              />
            ) : activeTab === 'chat' ? (
              <ChatWidget 
                selectedThemes={selectedThemes}
                onThemeChange={setSelectedThemes}
              />
            ) : (
              <DocumentGenerator />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-secondary-500">
              © 2024 AIME Knowledge Hub. Powered by AI and open knowledge.
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="text-sm text-secondary-500 hover:text-secondary-700 flex items-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>View on Airtable</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 