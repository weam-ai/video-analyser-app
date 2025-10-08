'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Video, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoAnalysisResult {
  fileMetadata: {
    name: string;
    state?: { name: string };
    [key: string]: unknown;
  };
  summary: string;
  videoUrl: string;
  size: number;
}

export default function VideoAnalyzer() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptType, setPromptType] = useState<'default' | 'custom'>('default');
  const [customPromptInput, setCustomPromptInput] = useState('');
  const router = useRouter();

  // Function to detect if URL is YouTube or Loom
  const detectVideoType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('loom.com')) {
      return 'loom';
    }
    return null;
  };

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a Loom or YouTube video URL');
      return;
    }

    const videoType = detectVideoType(videoUrl);
    if (!videoType) {
      setError('Please enter a valid Loom or YouTube video URL');
      return;
    }

    // Validate custom prompt if selected
    if (promptType === 'custom' && !customPromptInput.trim()) {
      setError('Please enter a custom prompt');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      let data;

      // Get the selected prompt
      const selectedPrompt = promptType === 'custom' ? customPromptInput : 'exampple'; // Default prompt placeholder

      if (videoType === 'youtube') {
        // Use analyze-youtube API for YouTube videos
        response = await fetch('/api/analyze-youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: videoUrl,
            prompt: selectedPrompt
          }),
        });

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze YouTube video');
        }

        // Transform YouTube response to match expected format
        setResult({
          fileMetadata: { name: 'YouTube Video', state: { name: 'Analyzed' } },
          summary: data.summary,
          videoUrl: videoUrl,
          size: 0 // YouTube videos don't have file size
        });
      } else {
        // Use upload-video API for Loom videos
        response = await fetch('/api/upload-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: videoUrl,
            companyId: 'default',
            companymodel: 'default',
            agentExtraInfo: {},
            prompt: selectedPrompt
          }),
        });

        data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload video');
        }

        setResult(data.data);
      }
      
      // Store video summary in sessionStorage for chat
      sessionStorage.setItem('videoSummary', JSON.stringify({
        fileMetadata: { name: videoType === 'youtube' ? 'YouTube Video' : data.data?.fileMetadata?.name || 'Video' },
        summary: videoType === 'youtube' ? data.summary : data.data?.summary,
        videoUrl: videoUrl,
        size: videoType === 'youtube' ? 0 : data.data?.size || 0,
        videoAnalysisId: videoType === 'youtube' ? data.videoAnalysisId : data.data?.videoAnalysisId
      }));
      
      // Automatically redirect to chat page after successful analysis
      setTimeout(() => {
        router.push('/chat');
      }, 2000); // 2 second delay to show success message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAnalysis = async () => {
    if (!result || !customPrompt.trim()) {
      setError('Please enter a custom prompt for analysis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: result.fileMetadata.name,
          prompt: customPrompt
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      setResult(prev => prev ? { ...prev, summary: data.data.analysis } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Video URL (Loom or YouTube)
            </label>
            <div className="flex gap-3">
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://www.loom.com/share/your-video-id or https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUpload();
                  }
                }}
              />
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Analyze Video
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Prompt Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a Prompt
            </label>
            <div className="space-y-3">
              {/* Default Prompt Option */}
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="default-prompt"
                  name="prompt-type"
                  value="default"
                  checked={promptType === 'default'}
                  onChange={(e) => setPromptType(e.target.value as 'default' | 'custom')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="default-prompt" className="block text-sm font-medium text-gray-700 cursor-pointer">
                    Default Prompt
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Use the default analysis prompt for comprehensive video summary
                  </p>
                  {promptType === 'default' && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Example default prompt:</span> "exampple" (placeholder to be replaced)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Prompt Option */}
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="custom-prompt"
                  name="prompt-type"
                  value="custom"
                  checked={promptType === 'custom'}
                  onChange={(e) => setPromptType(e.target.value as 'default' | 'custom')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700 cursor-pointer">
                    Custom Prompt
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Write your own prompt for specific analysis requirements
                  </p>
                  {promptType === 'custom' && (
                    <div className="mt-2">
                      <Textarea
                        placeholder="Enter your custom prompt here..."
                        value={customPromptInput}
                        onChange={(e) => setCustomPromptInput(e.target.value)}
                        className="w-full"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Card className="p-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-700 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Video Successfully Analyzed!</span>
            </div>
            <div className="text-sm text-green-600 mb-2">
              🚀 Redirecting to chat page in a moment...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {result.size > 0 && (
                <div>
                  <span className="font-medium">File Size:</span> {result.size.toFixed(2)} GB
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span> {result.fileMetadata.state?.name || 'Analyzed'}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">AI-Generated Summary</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.summary)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {result.summary}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Custom Analysis</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Ask a specific question about the video
                </label>
                <Textarea
                  id="customPrompt"
                  placeholder="e.g., What are the main technical concepts discussed? What are the key takeaways for developers?"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCustomAnalysis}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze with Custom Prompt'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
