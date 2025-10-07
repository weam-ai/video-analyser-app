import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { VideoAnalysis } from '@/lib/models';
import { COLLECTION_NAMES } from '@/common/config';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection<VideoAnalysis>(COLLECTION_NAMES.VIDEO_ANALYSES);
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Fetch video analyses sorted by creation date (newest first)
    const analyses = await collection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await collection.countDocuments();
    
    return NextResponse.json({
      success: true,
      data: analyses,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching video history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch video history' 
      },
      { status: 500 }
    );
  }
}
