import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { VideoAnalysis } from '@/lib/models';
import { COLLECTION_NAMES } from '@/common/config';
import { ObjectId } from 'mongodb';

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');

    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const videoCollection = db.collection<VideoAnalysis>(COLLECTION_NAMES.VIDEO_ANALYSES);
    const chatCollection = db.collection(COLLECTION_NAMES.CHAT_MESSAGES);

    // Find the video to get its details before deletion
    const video = await videoCollection.findOne({ _id: new ObjectId(videoId) });
    
    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    // Delete associated chat messages
    await chatCollection.deleteMany({ videoAnalysisId: videoId });

    // Delete the video analysis
    const deleteResult = await videoCollection.deleteOne({ _id: new ObjectId(videoId) });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete video' },
        { status: 500 }
      );
    }

    // Note: Video files are already deleted from Gemini after analysis completes
    // No need to delete again here
    console.log(`Video analysis deleted from database: ${video.fileName || video.videoUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Video and associated chat messages deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete video' 
      },
      { status: 500 }
    );
  }
}
