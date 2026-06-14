import mongoose, { type Connection } from 'mongoose';
import pino from 'pino';
import { env } from '@/config/env';

const logger = pino({ name: 'database' });

let listenersRegistered = false;

function registerConnectionListeners(connection: Connection): void {
  if (listenersRegistered) {
    return;
  }

  connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });

  connection.on('error', (error: Error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  listenersRegistered = true;
}

function formatConnectionError(error: unknown, action: 'connect' | 'disconnect'): string {
  const detail = error instanceof Error ? error.message : 'Unknown error';
  return `Failed to ${action} to MongoDB: ${detail}`;
}

export async function connectDatabase(): Promise<void> {
  registerConnectionListeners(mongoose.connection);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    logger.info('Connected to MongoDB Atlas');
  } catch (error) {
    const message = formatConnectionError(error, 'connect');
    logger.error({ err: error }, message);
    throw new Error(message, { cause: error });
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    const message = formatConnectionError(error, 'disconnect');
    logger.error({ err: error }, message);
    throw new Error(message, { cause: error });
  }
}

export type DatabaseStatus = 'connected' | 'disconnected';

export function getDatabaseStatus(): DatabaseStatus {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
