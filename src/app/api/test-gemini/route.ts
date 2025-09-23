import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'demo-key') {
      return NextResponse.json({
        status: 'demo',
        message: 'No valid Gemini API key found. Running in demo mode.',
        hasApiKey: false
      });
    }

    // Test the API key by making a simple request
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Hello, please respond with "API key is working" if you can read this.');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      status: 'success',
      message: 'Gemini API key is valid and working!',
      hasApiKey: true,
      testResponse: text
    });

  } catch (error) {
    console.error('Gemini API Test Error:', error);
    return NextResponse.json({
      status: 'error',
      message: `Gemini API key test failed: ${error}`,
      hasApiKey: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
