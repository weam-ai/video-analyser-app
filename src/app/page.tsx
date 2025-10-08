'use client';

import { useState, useEffect } from 'react';
import { Video, AlertCircle } from 'lucide-react';
import VideoAnalyzer from '@/components/VideoAnalyzer';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/check-api-key');
        const data = await response.json();
        setHasGeminiKey(data.hasApiKey);
      } catch (error) {
        console.error('Error checking API key:', error);
        setHasGeminiKey(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiKey();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Sidebar - Red highlighted area */}
        <div className="w-80 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                <Video className="h-10 w-10 text-blue-600" />
                Loom or Youtube Video Analyzer
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Upload and analyze your Loom videos with AI-powered insights
              </p>
              
              {/* API Key Status */}
              {!hasGeminiKey ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-auto">
                  <p className="text-red-800 text-sm flex items-center justify-center gap-2">
                  Please add GEMINI_API_KEY to your environment variables in order to use the application.
                  </p>
                </div>
              ) : <></>}
            </div>

            <VideoAnalyzer />
          </div>
        </div>
      </div>
    </div>
  );
}
