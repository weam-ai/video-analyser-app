export interface VideoAnalysis {
  _id?: string;
  videoUrl: string;
  videoType: 'youtube' | 'loom';
  fileName: string;
  fileSize?: number;
  summary: string;
  analysis?: string;
  customPrompt?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    duration?: number;
    resolution?: string;
    thumbnail?: string;
    [key: string]: unknown;
  };
}

export interface ChatMessage {
  _id?: string;
  videoAnalysisId: string;
  messageId: string;
  question: string;
  answer: string;
  timestamp: Date;
  metadata?: {
    responseTime?: number;
    [key: string]: unknown;
  };
}

export interface ChatSession {
  _id?: string;
  videoAnalysisId: string;
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
