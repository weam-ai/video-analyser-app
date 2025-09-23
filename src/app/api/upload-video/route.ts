import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, getVideoUrl, extractMainDomain, getVideoSize, getSizeInGB } from '@/lib/video-utils';
import { MessageDecryptor } from '@/lib/crypto-utils';
import { GeminiClient } from '@/lib/gemini-client';

const VIDEO_LIMIT_MINUTES = 30;
const STORAGE_LIMIT_GB = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, cdnUrl, companyId, companymodel, agentExtraInfo } = body;

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
    if (totalStorageGB > STORAGE_LIMIT_GB) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Please delete some files to free up space.' },
        { status: 507 }
      );
    }

    // Initialize Gemini client
    const apiKey = process.env.GEMINI_API_KEY || 'demo-key';
    
    const geminiClient = new GeminiClient(apiKey);
    
    // Upload file to Gemini
    const fileMetadata = await geminiClient.uploadFile(videoUrl);
    // console.log('File metadata:', fileMetadata);

    // Generate summary with video metadata
    const summary = await geminiClient.analyzeVideo(fileMetadata.name, '', fileMetadata);
    // console.log('Summary:', summary);

    return NextResponse.json({
      status: 200,
      message: 'Video uploaded and analyzed successfully',
      data: {
        fileMetadata,
        summary,
        videoUrl,
        size: sizeGB
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
