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
    if (!videoAnalysis) {
      return NextResponse.json(
        { error: 'Video analysis not found' },
        { status: 404 }
      );
    }

    // Add user message to database
    const userMessage = await chatService.addMessageToSession(chatSession.sessionId, {
      messageId: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      metadata: {
        prompt: message
      }
    });

    // Generate AI response
    const startTime = Date.now();
    const aiResponse = await geminiClient.analyzeVideo(
      videoAnalysis.fileName, 
      message, 
      videoAnalysis.metadata
    );
    const responseTime = Date.now() - startTime;

    // Add AI response to database
    const assistantMessage = await chatService.addMessageToSession(chatSession.sessionId, {
      messageId: `msg_${Date.now() + 1}`,
      type: 'assistant',
      content: aiResponse,
      metadata: {
        responseTime,
        videoAnalysisId
      }
    });

    return NextResponse.json({
      status: 200,
      message: 'Chat message processed successfully',
      data: {
        userMessage,
        assistantMessage,
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
