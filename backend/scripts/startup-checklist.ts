import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { checkChatHealth } from '../src/services/system.service';

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function logWarn(message: string): void {
  console.warn(`⚠ ${message}`);
}

function logFail(message: string): void {
  console.error(`✗ ${message}`);
}

async function checkVectorSearchIndex(): Promise<void> {
  const collection = mongoose.connection.db?.collection('documents');
  if (!collection) {
    logWarn('Could not access documents collection to verify vector search index');
    return;
  }

  try {
    const indexes = await collection.listSearchIndexes().toArray();
    const found = indexes.some((index) => index.name === env.VECTOR_SEARCH_INDEX_NAME);

    if (found) {
      logOk(`Vector search index "${env.VECTOR_SEARCH_INDEX_NAME}" found`);
      return;
    }

    logWarn(
      `Vector search index "${env.VECTOR_SEARCH_INDEX_NAME}" not found — semantic search and RAG will fail until created (see docs/ATLAS_VECTOR_SEARCH_SETUP.md)`,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    logWarn(`Could not verify vector search index: ${detail}`);
  }
}

async function main(): Promise<void> {
  const failures: string[] = [];

  console.log('=== Memora AI Startup Checklist ===\n');

  logOk(`Environment validated (NODE_ENV=${env.NODE_ENV}, PORT=${env.PORT})`);

  try {
    await connectDatabase();
    logOk('MongoDB connection successful');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    failures.push(`MongoDB connection failed: ${detail}`);
  }

  if (mongoose.connection.readyState === 1) {
    await checkVectorSearchIndex();
  }

  if (!env.GOOGLE_AI_API_KEY) {
    logWarn('GOOGLE_AI_API_KEY not set — document embeddings and semantic search disabled');
  } else {
    logOk('GOOGLE_AI_API_KEY configured');
  }

  if (!env.GROQ_API_KEY) {
    logWarn('GROQ_API_KEY not set — RAG chat answer generation disabled');
  } else {
    logOk('GROQ_API_KEY configured');
    const chatHealth = await checkChatHealth();
    if (chatHealth.status === 'ok') {
      logOk(`Groq chat health check passed (model: ${chatHealth.model})`);
    } else {
      logWarn(`Groq chat health check failed: ${chatHealth.error ?? 'unknown error'}`);
    }
  }

  if (!env.GOOGLE_CLIENT_ID) {
    logWarn('GOOGLE_CLIENT_ID not set — Google sign-in disabled');
  } else {
    logOk('GOOGLE_CLIENT_ID configured');
  }

  if (env.HEALTH_ENDPOINTS_ENABLED) {
    logOk('Admin health endpoints enabled (GET /api/v1/health, GET /api/v1/system/chat-health)');
  } else {
    logWarn(
      'HEALTH_ENDPOINTS_ENABLED=false — admin health endpoints return 404; use GET /api/v1/health/live for liveness',
    );
  }

  if (mongoose.connection.readyState === 1) {
    await disconnectDatabase();
  }

  console.log('');

  if (failures.length > 0) {
    failures.forEach(logFail);
    process.exit(1);
  }

  console.log('Startup checklist passed.');
}

main().catch((error) => {
  logFail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
