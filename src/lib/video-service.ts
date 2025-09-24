import { connectToDatabase } from './database';
import { VideoAnalysis } from './models';
import { Collection } from 'mongodb';
import { COLLECTION_NAMES } from '../common/config';

export class VideoService {
  private static instance: VideoService;
  private db: Collection<VideoAnalysis> | null = null;

  private constructor() {}

  public static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  private async getDb() {
    if (!this.db) {
      const database = await connectToDatabase();
      this.db = database.collection<VideoAnalysis>(COLLECTION_NAMES.VIDEO_ANALYSES);
    }
    return this.db;
  }

  async createVideoAnalysis(data: Omit<VideoAnalysis, '_id' | 'createdAt' | 'updatedAt'>): Promise<VideoAnalysis> {
    const db = await this.getDb();
    const now = new Date();
    
    const videoAnalysis: VideoAnalysis = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insertOne(videoAnalysis);
    return { ...videoAnalysis, _id: result.insertedId.toString() };
  }

  async updateVideoAnalysis(id: string, updates: Partial<VideoAnalysis>): Promise<VideoAnalysis | null> {
    const db = await this.getDb();
    
    const result = await db.findOneAndUpdate(
      { _id: id },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async getVideoAnalysis(id: string): Promise<VideoAnalysis | null> {
    const db = await this.getDb();
    return await db.findOne({ _id: id });
  }

  async getVideoAnalysisByUrl(videoUrl: string): Promise<VideoAnalysis | null> {
    const db = await this.getDb();
    return await db.findOne({ videoUrl });
  }

  async getAllVideoAnalyses(limit: number = 50, skip: number = 0): Promise<VideoAnalysis[]> {
    const db = await this.getDb();
    return await db.find({}).sort({ createdAt: -1 }).limit(limit).skip(skip).toArray();
  }

  async deleteVideoAnalysis(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
