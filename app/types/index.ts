// Centralized type definitions for the application

export interface Document {
  id: string
  title: string
  author: string
  date: string
  topics: string[]
  fullText: string
  summary?: string
  fileUrl?: string
  processedAt?: string
  chunkCount: number
}

export interface Theme {
  id: string
  name: string
  description?: string
  count: number
}

export interface ExtractableFact {
  content: string
  confidence: number
  source_context: string
  suggested_tags: string[]
}

export interface ValidationSnippet {
  id: string
  content: string
  source: string
  source_context?: string
  confidence_score?: number
  tags?: string[]
  created_at: string
  staff_votes: number
  community_votes: number
  elders_votes: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface Tool {
  id: string
  name: string
  description: string
  format: string
  area: string
  tags: string[]
  url?: string
  fileUrl?: string
  status: string
}

export interface Mailout {
  id: string
  title: string
  description: string
  status: string
  date: string
  url?: string
  fileUrl?: string
}

export interface Video {
  id: string
  title: string
  description: string
  source: string
  year: string
  area: string
  tags: string[]
  url?: string
  thumbnail?: string
  duration?: string
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface SearchResult {
  documents: Document[]
  totalCount: number
  query: string
}

export interface APIError {
  error: string
  details?: string
  code?: string
}

export interface APIResponse<T> {
  data?: T
  error?: string
  message?: string
} 