import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VideoService } from '@/lib/video-service';
import { ENV_VARS } from '@/common/config';

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(ENV_VARS.GOOGLE_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = "Please summarize the video in 3 sentences.";

    function cleanYoutubeUrl(url: string) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    }

    const cleanedUrl = cleanYoutubeUrl(videoUrl);

    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: cleanedUrl,
          mimeType: "video/youtube",
        },
      },
    ]);

    const summary = result.response.text();

    // Store video analysis in database
    const videoService = VideoService.getInstance();
    const videoAnalysis = await videoService.createVideoAnalysis({
      videoUrl: cleanedUrl,
      videoType: 'youtube',
      fileName: 'YouTube Video',
      summary: summary,
      metadata: {
        originalUrl: videoUrl,
        cleanedUrl: cleanedUrl,
        platform: 'youtube'
      }
    });

    return NextResponse.json({ 
      summary,
      videoAnalysisId: videoAnalysis._id
    });
  } catch (error: unknown) {
    console.error("Error summarizing video:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
