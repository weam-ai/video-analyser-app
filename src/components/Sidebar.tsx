'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { VideoAnalysis } from '@/lib/models';
import { useRouter } from 'next/navigation';

interface VideoHistoryResponse {
  success: boolean;
  data: VideoAnalysis[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  error?: string;
}

export default function Sidebar() {
  const [histories, setHistories] = useState<VideoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    skip: 0,
    hasMore: false
  });
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const router = useRouter();

  const fetchHistory = async (skip = 0, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/video-history?limit=10&skip=${skip}`);
      const data: VideoHistoryResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video history');
      }
      
      if (append) {
        setHistories(prev => [...prev, ...data.data]);
      } else {
        setHistories(data.data);
      }
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchHistory(pagination.skip + pagination.limit, true);
    }
  };

  const refreshHistory = () => {
    fetchHistory(0, false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleHistoryClick = (history: VideoAnalysis) => {
    // Set selected video ID for highlighting
    setSelectedVideoId(history._id || null);
    
    // Store video summary in sessionStorage for chat
    const videoData = {
      fileMetadata: { name: history.fileName },
      summary: history.summary,
      videoUrl: history.videoUrl,
      size: history.fileSize || 0,
      videoAnalysisId: history._id
    };
    
    sessionStorage.setItem('videoSummary', JSON.stringify(videoData));
    
    // Dispatch custom event to notify chat page of video change
    window.dispatchEvent(new CustomEvent('videoChanged', { detail: videoData }));
    
    // Navigate to chat page
    router.push('/chat');
  };

  const getVideoTypeIcon = (videoType: string) => {
    return videoType === 'youtube' ? '🎥' : '📹';
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Check for current video from sessionStorage to highlight it
  useEffect(() => {
    const storedSummary = sessionStorage.getItem('videoSummary');
    if (storedSummary) {
      const summary = JSON.parse(storedSummary);
      if (summary.videoAnalysisId) {
        setSelectedVideoId(summary.videoAnalysisId);
      }
    }
  }, []);

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Video History
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshHistory}
            disabled={loading}
            className="p-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          {pagination.total} video{pagination.total !== 1 ? 's' : ''} analyzed
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && histories.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-4">
            <Card className="p-4 border-red-200 bg-red-50">
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshHistory}
                className="mt-2"
              >
                Try Again
              </Button>
            </Card>
          </div>
        ) : histories.length === 0 ? (
          <div className="p-4">
            <Card className="p-4 text-center">
              <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No videos analyzed yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Start by analyzing your first video
              </p>
            </Card>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {histories.map((history) => (
              <Card
                key={history._id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedVideoId === history._id
                    ? 'bg-blue-50 border-blue-200 border-2'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleHistoryClick(history)}
              >
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg">
                        {getVideoTypeIcon(history.videoType)}
                      </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {history.videoUrl}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">
                              {history.videoType}
                            </span>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(history.createdAt)}
                            </p>
                          </div>
                        </div>
                    </div>
                  </div>
                  
                  {history.metadata?.duration && (
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-500">
                        {Math.floor(history.metadata.duration / 60)}m {history.metadata.duration % 60}s
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
            
            {/* Load More Button */}
            {pagination.hasMore && (
              <div className="p-2">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
