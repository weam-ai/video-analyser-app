'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, Video, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
}

interface VideoSummary {
  fileMetadata: {
    name: string;
    state?: { name: string };
    [key: string]: unknown;
  };
  summary: string;
  videoUrl: string;
  size: number;
  videoAnalysisId?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadChatMessages = useCallback(async (videoAnalysisId: string) => {
    try {
      const response = await fetch(`/api/chat?videoAnalysisId=${videoAnalysisId}`);
      const data = await response.json();
      
      // Always start with video analysis summary
      const summaryMessage = {
        id: 'video-summary',
        question: '',
        answer: `I've analyzed your video "${videoSummary?.fileMetadata?.name || 'video'}" and I'm ready to answer any questions you have about it!\n\n**Video Summary:**\n${videoSummary?.summary}\n\nFeel free to ask me anything about the content, concepts, or details mentioned in the video.`,
        timestamp: new Date()
      };

      if (response.ok && data.data.messages.length > 0) {
        // Convert database messages to chat format and add after summary
        const chatMessages = data.data.messages.map((msg: { messageId: string; question: string; answer: string; timestamp: string }) => ({
          id: msg.messageId,
          question: msg.question,
          answer: msg.answer,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages([summaryMessage, ...chatMessages]);
      } else {
        // Only summary message if no existing chat
        setMessages([summaryMessage]);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      // Fallback to initial summary message
      setMessages([{
        id: 'video-summary',
        question: '',
        answer: `I've analyzed your video "${videoSummary?.fileMetadata?.name || 'video'}" and I'm ready to answer any questions you have about it!\n\n**Video Summary:**\n${videoSummary?.summary}\n\nFeel free to ask me anything about the content, concepts, or details mentioned in the video.`,
        timestamp: new Date()
      }]);
    }
  }, [videoSummary?.summary, videoSummary?.fileMetadata?.name]);

  const loadVideoSummary = useCallback(async () => {
    const storedSummary = sessionStorage.getItem('videoSummary');
    if (storedSummary) {
      setIsLoadingVideo(true);
      const summary = JSON.parse(storedSummary);
      setVideoSummary(summary);
      setFileName(summary.fileMetadata?.name || '');
      setSessionId(`session_${Date.now()}`);
      
      // Load existing chat messages if videoAnalysisId exists
      if (summary.videoAnalysisId) {
        await loadChatMessages(summary.videoAnalysisId);
      } else {
        // Add initial summary message if no existing chat
        setMessages([{
          id: 'video-summary',
          question: '',
          answer: `I've analyzed your video "${summary.fileMetadata?.name || 'video'}" and I'm ready to answer any questions you have about it!\n\n**Video Summary:**\n${summary.summary}\n\nFeel free to ask me anything about the content, concepts, or details mentioned in the video.`,
          timestamp: new Date()
        }]);
      }
      setIsLoadingVideo(false);
    }
  }, [loadChatMessages]);

  useEffect(() => {
    // Initial load
    loadVideoSummary();

    // Listen for storage changes (when sidebar selects a new video)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'videoSummary' && e.newValue) {
        loadVideoSummary();
      }
    };

    // Listen for custom events (for same-tab updates)
    const handleVideoChange = () => {
      loadVideoSummary();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('videoChanged', handleVideoChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('videoChanged', handleVideoChange);
    };
  }, [loadVideoSummary]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !videoSummary || !videoSummary.videoAnalysisId) return;

    const currentMessage = inputMessage;
    const tempId = `temp_${Date.now()}`;
    setInputMessage('');
    setIsLoading(true);

    // Add question immediately with empty answer (shows loading state)
    const tempMessage: ChatMessage = {
      id: tempId,
      question: currentMessage,
      answer: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          videoAnalysisId: videoSummary.videoAnalysisId,
          sessionId: sessionId,
          videoUrl: videoSummary.videoUrl,
          videoType: videoSummary.videoUrl.includes('youtube') ? 'youtube' : 'loom',
          fileName: fileName,
          videoMetadata: videoSummary.fileMetadata
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update the temporary message with the actual Q&A data
      const qaMessage: ChatMessage = {
        id: data.data.qaMessage.messageId,
        question: data.data.qaMessage.question,
        answer: data.data.qaMessage.answer,
        timestamp: new Date(data.data.qaMessage.timestamp)
      };

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? qaMessage : msg
      ));
    } catch (error) {
      // Update the temporary message with error
      const errorMessage: ChatMessage = {
        id: tempId,
        question: currentMessage,
        answer: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? errorMessage : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!videoSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
              <Card className="p-8 text-center">
                <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Video Summary Found</h2>
                <p className="text-gray-600 mb-6">
                  Please analyze a video first to start a chat session.
                </p>
                <Link href="/">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back to Video Analyzer
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Video Chat</h1>
                  <p className="text-sm text-gray-600">Ask questions about your video</p>
                </div>
              </div>
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Analyzer
                </Button>
              </Link>
            </div>

            {/* Video Info */}
            <Card className="p-4 mb-6 bg-white/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-blue-600" />
                  <p className="font-medium text-gray-900">Video Analysis Complete</p>
                </div>
                <div className="text-sm text-gray-600">
                  <span>File: {videoSummary.fileMetadata?.name}</span>
                  <span className="mx-2">•</span>
                  <span>Size: {(videoSummary.size * 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </Card>

            {/* Chat Messages */}
            <div className="space-y-4 pb-32 overflow-y-auto scroll-smooth flex-1">
              {isLoadingVideo ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Loading video chat...</span>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {/* Video Summary Message - Special styling */}
                  {message.id === 'video-summary' ? (
                    <div className="flex justify-center">
                      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 max-w-[100%]">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">Video Analysis Complete</span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                          {message.answer}
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <>
                      {/* Question */}
                      {message.question && (
                        <div className="flex justify-end">
                          <div className="flex items-start gap-3 max-w-[80%] flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                            <Card className="p-4 bg-blue-600 text-white">
                              <div className="whitespace-pre-wrap text-sm">
                                {message.question}
                              </div>
                            </Card>
                          </div>
                        </div>
                      )}
                      
                      {/* Answer */}
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-[80%] flex-row">
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <Card className="p-4 bg-white">
                            {message.answer ? (
                              <>
                                <div className="whitespace-pre-wrap text-sm">
                                  {message.answer}
                                </div>
                                <div className="text-xs mt-2 text-gray-500">
                                  {message.timestamp.toLocaleTimeString()}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-600">Thinking...</span>
                              </div>
                            )}
                          </Card>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                ))
              )}
              {/* Invisible element to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="fixed bottom-0 left-80 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the video..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
