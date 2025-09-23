'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Video, Upload, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoAnalysisResult {
  fileMetadata: any;
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
  const router = useRouter();

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a Loom video URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          companyId: 'default',
          companymodel: 'default',
          agentExtraInfo: {}
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video');
      }

      setResult(data.data);
      
      // Store video summary in sessionStorage for chat
      sessionStorage.setItem('videoSummary', JSON.stringify(data.data));
      
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
              Loom Video URL
            </label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://www.loom.com/share/your-video-id"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Video...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Analyze
              </>
            )}
          </Button>
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
              <div>
                <span className="font-medium">File Size:</span> {result.size.toFixed(2)} GB
              </div>
              <div>
                <span className="font-medium">Status:</span> {result.fileMetadata.state.name}
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
