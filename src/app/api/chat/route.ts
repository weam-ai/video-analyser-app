import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini-client';
import { VideoService } from '@/lib/video-service';
import { ChatService } from '@/lib/chat-service';
import { ENV_VARS } from '@/common/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      videoAnalysisId, 
      sessionId
    } = body;

    if (!message || !videoAnalysisId) {
      return NextResponse.json(
        { error: 'Message and videoAnalysisId are required' },
        { status: 400 }
      );
    }

    const videoService = VideoService.getInstance();
    const chatService = ChatService.getInstance();
    const geminiClient = new GeminiClient(ENV_VARS.GEMINI_API_KEY || 'demo-key');

    // Get or create chat session
    let chatSession = await chatService.getChatSessionByVideoId(videoAnalysisId);
    if (!chatSession) {
      chatSession = await chatService.createChatSession(videoAnalysisId, sessionId || `session_${Date.now()}`);
    }

    // Get video analysis
    const videoAnalysis = await videoService.getVideoAnalysis(videoAnalysisId);
    console.log('Video analysis:', videoAnalysis);
    if (!videoAnalysis) {
      return NextResponse.json(
        { error: 'Video analysis not found' },
        { status: 404 }
      );
    }

    // Generate AI response with video context
    const startTime = Date.now();
    
    // Create a context-aware prompt that includes the video summary
    const contextualPrompt = `You are a helpful AI assistant that can answer questions about a video that has been analyzed. 

VIDEO CONTEXT:
- Video File: ${videoAnalysis.fileName}
- Video Summary: ${videoAnalysis.summary}
- Video Type: ${videoAnalysis.videoType}
- Video URL: ${videoAnalysis.videoUrl}

USER QUESTION: ${message}

Please provide a helpful response based on the video content and summary above. If the user's question is related to the video, use the video summary to provide accurate information. If the question is not related to the video, you can still help but mention that you're answering based on general knowledge rather than the video content.`;

    const aiResponse = await geminiClient.analyzeVideo(
      videoAnalysis.fileName, 
      contextualPrompt, 
      videoAnalysis.metadata
    );
    const responseTime = Date.now() - startTime;

    // Add single Q&A entry to database
    const qaMessage = await chatService.addMessageToSession(chatSession.sessionId, {
      messageId: `msg_${Date.now()}`,
      question: message,
      answer: aiResponse,
      metadata: {
        responseTime,
        videoAnalysisId
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Chat message processed successfully',
      data: {
        qaMessage,
        sessionId: chatSession.sessionId
      }
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: `Failed to process chat message: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const videoAnalysisId = searchParams.get('videoAnalysisId');

    if (!sessionId && !videoAnalysisId) {
      return NextResponse.json(
        { error: 'Either sessionId or videoAnalysisId is required' },
        { status: 400 }
      );
    }

    const chatService = ChatService.getInstance();
    let messages;

    if (sessionId) {
      messages = await chatService.getMessagesBySession(sessionId);
    } else {
      messages = await chatService.getMessagesByVideoId(videoAnalysisId!);
    }

    return NextResponse.json({
      status: 200,
      data: { messages }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: `Failed to fetch chat messages: ${error}` },
      { status: 500 }
    );
  }
}
