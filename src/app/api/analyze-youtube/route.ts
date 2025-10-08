import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VideoService } from '@/lib/video-service';
import { ENV_VARS, GEMINI_MODELS } from '@/common/config';
import { formatJsonToText } from '@/lib/text-formatter';

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, prompt } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    const apiKey = ENV_VARS.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'demo-key') {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.PRO });

    // Use provided prompt or default prompt
    const analysisPrompt = prompt || "Please summarize the video.";

    function cleanYoutubeUrl(url: string) {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    }

    const cleanedUrl = cleanYoutubeUrl(videoUrl);

    const result = await model.generateContent([
      analysisPrompt,
      {
        fileData: {
          fileUri: cleanedUrl,
          mimeType: "video/youtube",
        },
      },
    ]);

    const summary = formatJsonToText(result.response.text());

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
