import { NextResponse } from 'next/server';
import { ENV_VARS } from '@/common/config';

export async function GET() {
  try {
    const hasGeminiKey = !!(ENV_VARS.GEMINI_API_KEY && ENV_VARS.GEMINI_API_KEY !== 'demo-key');
    
    return NextResponse.json({
      success: true,
      hasApiKey: hasGeminiKey,
      message: hasGeminiKey 
        ? 'Gemini API key is configured' 
        : 'Gemini API key is not configured'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        hasApiKey: false,
        error: 'Failed to check API key status' 
      },
      { status: 500 }
    );
  }
}
