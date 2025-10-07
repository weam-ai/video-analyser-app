import { MongoClient, Db } from 'mongodb';
import { ENV_VARS, DEFAULTS } from '../common/config';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Utility function to generate MongoDB URI from environment variables
 * This function handles both direct MONGODB_URI and individual component configuration
 * Only executes when called, not at module load time
 */
export function getMongoUri(): string | null {
    // Only execute in server-side environment
    if (typeof window !== 'undefined') {
        return null;
    }
    
    // If MONGODB_URI is provided, use it directly
    if (ENV_VARS.MONGODB_URI) {
        return ENV_VARS.MONGODB_URI || null;
    }
    
    // Otherwise, construct URI from individual components
    const connection = ENV_VARS.DB_CONNECTION || DEFAULTS.DB_CONNECTION;
    const host = ENV_VARS.DB_HOST;
    const database = ENV_VARS.DB_DATABASE;
    const username = ENV_VARS.DB_USERNAME;
    const password = ENV_VARS.DB_PASSWORD;
    const port = ENV_VARS.DB_PORT;
    
    // Check if required components are available
    if (!host || !database || !username || !password) {
        return null; // Return null if required components are missing
    }
    
    // Construct the URI
    let uri = `${connection}://${username}:${password}@${host}`;
    
    // Add port if provided
    if (port) {
        uri += `:${port}`;
    }
    
    // Add database
    uri += `/${database}`;
    
    // Add query parameters for MongoDB Atlas
    if (connection === "mongodb+srv") {
        uri += "?retryWrites=true&w=majority";
    }
    
    return uri;
}

export async function connectToDatabase(): Promise<Db> {
    if (db) {
        return db;
    }

    const uri = getMongoUri();
    if (!uri) {
        throw new Error('MongoDB connection string not found. Please set MONOGODB_URI or individual DB_* environment variables.');
    }

    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db();
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

export async function closeDatabaseConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('Disconnected from MongoDB');
    }
}

export function getDatabase(): Db | null {
    return db;
}
