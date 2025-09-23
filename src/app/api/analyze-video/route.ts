import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, prompt, videoMetadata } = body;

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || 'demo-key';
    const geminiClient = new GeminiClient(apiKey);
    
    let result: string;
    if (prompt) {
      result = await geminiClient.analyzeVideo(fileName, prompt, videoMetadata);
    } else {
      result = await geminiClient.generateSummary(fileName);
    }

    return NextResponse.json({
      status: 200,
      message: 'Video analysis completed successfully',
      data: {
        analysis: result,
        fileName
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
