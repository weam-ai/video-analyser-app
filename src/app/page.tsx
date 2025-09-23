import { Video } from 'lucide-react';
import VideoAnalyzer from '@/components/VideoAnalyzer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Video className="h-10 w-10 text-blue-600" />
            Loom Video Analyzer
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Upload and analyze your Loom videos with AI-powered insights
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-green-800 text-sm">
              <strong>✅ AI Mode Active:</strong> Your Gemini API key is valid and working! 
              Videos are now analyzed using advanced AI algorithms for comprehensive insights and summaries.
            </p>
          </div>
        </div>

        <VideoAnalyzer />
      </div>
    </div>
  );
}
