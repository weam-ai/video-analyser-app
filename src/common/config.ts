/**
 * Application configuration constants
 */

// Database collection names with prefix
export const COLLECTION_NAMES = {
  VIDEO_ANALYSES: 'solution_vianalyses_analyses',
  CHAT_MESSAGES: 'solution_vianalyses_messages',
  CHAT_SESSIONS: 'solution_vianalyses_sessions',
} as const;

// Environment variable names
export const ENV_VARS = {
  MONGODB_URI: process.env.MONGODB_URI,
  DB_CONNECTION: process.env.DB_CONNECTION,
  DB_HOST: process.env.DB_HOST,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
} as const;

// Gemini AI model configuration
export const GEMINI_MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-2.5-pro',
} as const;

// Default values
export const DEFAULTS = {
  DB_CONNECTION: 'mongodb+srv',
  STORAGE_LIMIT_GB: 20,
} as const;
