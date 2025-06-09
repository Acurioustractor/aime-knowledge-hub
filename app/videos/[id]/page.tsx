'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, Play, ExternalLink, Share2, Video, Youtube, Clock, Eye, Tag } from 'lucide-react'

interface Video {
  id: string
  name: string
  link: string
  description: string
  createdTime: string
  attachments: any[]
  thumbnail?: string | null
  area: string | null
  tags: string[]
  source: string
  duration?: string
}

interface RelatedVideo {
  id: string
  name: string
  link: string
  source: string
  area: string | null
  tags: string[]
  sharedTags: number
}

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchVideo(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (video && (video.tags.length > 0 || video.area)) {
      fetchRelatedVideos()
    }
  }, [video])

  const fetchVideo = async (id: string) => {
    try {
      const response = await fetch(`/api/videos/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Video not found')
        } else {
          setError('Failed to fetch video')
        }
        return
      }
      
      const data = await response.json()
      setVideo(data.video)
    } catch (err) {
      setError('Failed to fetch video')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedVideos = async () => {
    try {
      const response = await fetch('/api/videos')
      const data = await response.json()
      
      if (video) {
        const related = data.videos
          .filter((vid: any) => vid.id !== video.id)
          .map((vid: any) => {
            const sharedTags = vid.tags?.filter((tag: string) => 
              video.tags.includes(tag)
            ).length || 0
            const sameArea = vid.area && video.area && vid.area === video.area ? 1 : 0
            return {
              ...vid,
              sharedTags: sharedTags + sameArea
            }
          })
          .filter((vid: any) => vid.sharedTags > 0)
          .sort((a: any, b: any) => b.sharedTags - a.sharedTags)
          .slice(0, 4)
        
        setRelatedVideos(related)
      }
    } catch (err) {
      console.error('Failed to fetch related videos:', err)
    }
  }

  const getVideoType = (url: string): 'youtube' | 'vimeo' | 'unknown' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('vimeo.com')) return 'vimeo'
    return 'unknown'
  }

  const getVideoEmbed = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    
    return null
  }

  const shareVideo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.name,
          text: video?.description,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const videoType = getVideoType(video.link)
  const embedUrl = getVideoEmbed(video.link)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Videos
            </button>
            <div className="flex items-center space-x-4">
              <a
                href={video.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original
              </a>
              <button
                onClick={shareVideo}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Video Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Video Player */}
              <div className="aspect-video bg-black relative">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Unable to embed video</p>
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Watch on {videoType === 'youtube' ? 'YouTube' : videoType === 'vimeo' ? 'Vimeo' : 'Original Site'}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Details */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 flex-1">
                    {video.name}
                  </h1>
                  <div className="ml-4">
                    {videoType === 'youtube' ? (
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                        <Youtube className="w-4 h-4" />
                        <span>YouTube</span>
                      </div>
                    ) : videoType === 'vimeo' ? (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span>Vimeo</span>
                      </div>
                    ) : (
                      <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Video
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Metadata */}
                <div className="flex flex-wrap items-center gap-6 mb-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(video.createdTime)}</span>
                  </div>
                  {video.duration && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{video.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    <span>Source: {video.source}</span>
                  </div>
                </div>

                {/* Video Description */}
                {video.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {video.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Video Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform</span>
                    <span className="text-gray-900 capitalize">{videoType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source</span>
                    <span className="text-gray-900">{video.source}</span>
                  </div>
                  {video.area && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Area</span>
                      <span className="text-gray-900">{video.area}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published</span>
                    <span className="text-gray-900">{formatDate(video.createdTime)}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Videos */}
              {relatedVideos.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Videos</h3>
                  <div className="space-y-3">
                    {relatedVideos.map((relatedVideo) => (
                      <div
                        key={relatedVideo.id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          try {
                            router.push(`/videos/${relatedVideo.id}`)
                          } catch (error) {
                            console.error('Navigation error:', error)
                            // Fallback to window.location if router fails
                            window.location.href = `/videos/${relatedVideo.id}`
                          }
                        }}
                      >
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {relatedVideo.name}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="capitalize">{getVideoType(relatedVideo.link)}</span>
                          <div className="flex items-center">
                            <Play className="h-3 w-3 mr-1" />
                            <span>Watch</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Watch on {videoType === 'youtube' ? 'YouTube' : videoType === 'vimeo' ? 'Vimeo' : 'Original Site'}
                  </a>
                  <button
                    onClick={shareVideo}
                    className="block w-full text-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Share This Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 