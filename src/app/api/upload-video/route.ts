import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getVideoUrl, extractMainDomain, getVideoSize, getSizeInGB } from '@/lib/video-utils';
import { GeminiClient } from '@/lib/gemini-client';
import { VideoService } from '@/lib/video-service';
import { DEFAULTS, ENV_VARS } from '@/common/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, cdnUrl } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Extract domain and validate
    const domain = extractMainDomain(url);
    if (domain !== 'loom') {
      return NextResponse.json(
        { error: `Only Loom videos are supported. Detected domain: ${domain}` },
        { status: 400 }
      );
    }

    // Get video URL
    let videoUrl: string;
    if (cdnUrl) {
      videoUrl = cdnUrl;
    } else {
      const videoId = extractVideoId(url);
      videoUrl = await getVideoUrl(videoId);
    }

    // Get video size
    const size = await getVideoSize(videoUrl);
    const sizeGB = getSizeInGB(size);

    // Check video duration (simplified - in real implementation you'd get actual duration)
    // For now, we'll assume it's within limits
    if (sizeGB > 1) { // Rough estimate - 1GB for 30 minutes
      return NextResponse.json(
        { error: 'Video too long. Maximum allowed duration is 30 minutes.' },
        { status: 413 }
      );
    }

    // Check storage limits (simplified)
    const totalStorageGB = sizeGB; // In real implementation, sum all stored files
    if (totalStorageGB > DEFAULTS.STORAGE_LIMIT_GB) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Please delete some files to free up space.' },
        { status: 507 }
      );
    }

    // Initialize Gemini client
    const apiKey = ENV_VARS.GEMINI_API_KEY || 'demo-key';
    
    const geminiClient = new GeminiClient(apiKey);
    
    // Upload file to Gemini
    const fileMetadata = await geminiClient.uploadFile(videoUrl);
    // console.log('File metadata:', fileMetadata);

    // Generate summary with video metadata
    const summary = await geminiClient.analyzeVideo((fileMetadata as { name: string }).name, '', fileMetadata);
    // console.log('Summary:', summary);

    // Store video analysis in database
    const videoService = VideoService.getInstance();
    const videoAnalysis = await videoService.createVideoAnalysis({
      videoUrl: url,
      videoType: 'loom',
      fileName: (fileMetadata as { name: string }).name,
      summary: summary,
      fileSize: sizeGB,
      metadata: {
        ...(fileMetadata as Record<string, unknown>),
        cdnUrl: videoUrl,
        size: sizeGB,
        platform: 'loom'
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Video uploaded and analyzed successfully',
      data: {
        fileMetadata,
        summary,
        videoUrl,
        size: sizeGB,
        videoAnalysisId: videoAnalysis._id
      }
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: `Failed to upload video: ${error}` },
      { status: 500 }
    );
  }
}
