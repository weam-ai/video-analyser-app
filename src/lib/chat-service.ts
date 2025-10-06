import { connectToDatabase } from './database';
import { ChatMessage, ChatSession } from './models';
import { Collection } from 'mongodb';
import { COLLECTION_NAMES } from '../common/config';

export class ChatService {
  private static instance: ChatService;
  private messageDb: Collection<ChatMessage> | null = null;
  private sessionDb: Collection<ChatSession> | null = null;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private async getDbs() {
    if (!this.messageDb || !this.sessionDb) {
      const database = await connectToDatabase();
      this.messageDb = database.collection<ChatMessage>(COLLECTION_NAMES.CHAT_MESSAGES);
      this.sessionDb = database.collection<ChatSession>(COLLECTION_NAMES.CHAT_SESSIONS);
    }
    return { messageDb: this.messageDb, sessionDb: this.sessionDb };
  }

  async createChatSession(videoAnalysisId: string, sessionId: string): Promise<ChatSession> {
    const { sessionDb } = await this.getDbs();
    const now = new Date();
    
    const chatSession: ChatSession = {
      videoAnalysisId,
      sessionId,
      messages: [],
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    const result = await sessionDb.insertOne(chatSession);
    return { ...chatSession, _id: result.insertedId.toString() };
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const { sessionDb } = await this.getDbs();
    return await sessionDb.findOne({ sessionId });
  }

  async getChatSessionByVideoId(videoAnalysisId: string): Promise<ChatSession | null> {
    const { sessionDb } = await this.getDbs();
    return await sessionDb.findOne({ videoAnalysisId, isActive: true });
  }

  async addMessageToSession(
    sessionId: string, 
    message: Omit<ChatMessage, '_id' | 'timestamp' | 'videoAnalysisId'>
  ): Promise<ChatMessage> {
    const { messageDb, sessionDb } = await this.getDbs();
    const now = new Date();
    
    // Get the session to get videoAnalysisId
    const session = await sessionDb.findOne({ sessionId });
    if (!session) {
      throw new Error('Chat session not found');
    }

    const chatMessage: ChatMessage = {
      ...message,
      videoAnalysisId: session.videoAnalysisId,
      timestamp: now,
    };

    const result = await messageDb.insertOne(chatMessage);
    const insertedMessage = { ...chatMessage, _id: result.insertedId.toString() };

    // Update the session with the new message
    await sessionDb.updateOne(
      { sessionId },
      { 
        $push: { messages: insertedMessage } as any,
        $set: { updatedAt: now }
      }
    );

    return insertedMessage;
  }

  async getMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    const { messageDb } = await this.getDbs();
    const session = await this.getChatSession(sessionId);
    if (!session) {
      return [];
    }

    return await messageDb.find({ videoAnalysisId: session.videoAnalysisId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  async getMessagesByVideoId(videoAnalysisId: string): Promise<ChatMessage[]> {
    const { messageDb } = await this.getDbs();
    return await messageDb.find({ videoAnalysisId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  async endChatSession(sessionId: string): Promise<boolean> {
    const { sessionDb } = await this.getDbs();
    const result = await sessionDb.updateOne(
      { sessionId },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        } 
      }
    );
    return result.modifiedCount > 0;
  }

  async deleteChatSession(sessionId: string): Promise<boolean> {
    const { messageDb, sessionDb } = await this.getDbs();
    
    // Get session to find videoAnalysisId
    const session = await sessionDb.findOne({ sessionId });
    if (!session) {
      return false;
    }

    // Delete all messages for this video analysis
    await messageDb.deleteMany({ videoAnalysisId: session.videoAnalysisId });
    
    // Delete the session
    const result = await sessionDb.deleteOne({ sessionId });
    return result.deletedCount > 0;
  }
}
