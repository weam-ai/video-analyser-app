import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
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

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Error summarizing video:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
