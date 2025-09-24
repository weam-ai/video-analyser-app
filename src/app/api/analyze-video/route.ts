import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini-client';
import { VideoService } from '@/lib/video-service';
import { ENV_VARS } from '@/common/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, prompt, videoMetadata, videoUrl, videoType } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    const apiKey = ENV_VARS.GEMINI_API_KEY || 'demo-key';
    const geminiClient = new GeminiClient(apiKey);
    const videoService = VideoService.getInstance();
    
    let result: string;
    let videoAnalysisId: string | null = null;

    // If this is a custom analysis (with prompt), find existing video analysis
    if (prompt && videoUrl) {
      const existingAnalysis = await videoService.getVideoAnalysisByUrl(videoUrl);
      if (existingAnalysis) {
        videoAnalysisId = existingAnalysis._id!;
        // Update existing analysis with custom analysis
        result = await geminiClient.analyzeVideo(fileName, prompt, videoMetadata);
        await videoService.updateVideoAnalysis(videoAnalysisId, {
          analysis: result,
          customPrompt: prompt
        });
      } else {
        // Create new analysis if not found
        result = await geminiClient.analyzeVideo(fileName, prompt, videoMetadata);
        const newAnalysis = await videoService.createVideoAnalysis({
          videoUrl: videoUrl || '',
          videoType: videoType || 'loom',
          fileName,
          summary: result,
          analysis: result,
          customPrompt: prompt,
          metadata: videoMetadata
        });
        videoAnalysisId = newAnalysis._id!;
      }
    } else {
      // Generate summary for new video
      result = await geminiClient.generateSummary(fileName);
      
      // Store video analysis in database
      if (videoUrl) {
        const newAnalysis = await videoService.createVideoAnalysis({
          videoUrl,
          videoType: videoType || 'loom',
          fileName,
          summary: result,
          metadata: videoMetadata
        });
        videoAnalysisId = newAnalysis._id!;
      }
    }

    return NextResponse.json({
      status: 200,
      message: 'Video analysis completed successfully',
      data: {
        analysis: result,
        fileName,
        videoAnalysisId
      }
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json(
      { error: `Failed to analyze video: ${error}` },
      { status: 500 }
    );
  }
}
