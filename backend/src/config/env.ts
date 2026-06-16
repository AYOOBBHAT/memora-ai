import { z } from 'zod';
import dotenv from 'dotenv';

import { parseCorsOriginsInput } from './cors';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  /** @deprecated Use CORS_ORIGINS. Single origin kept for backward compatibility. */
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL').optional(),
  /** Comma-separated browser origins (https only in production). Native mobile apps omit Origin. */
  CORS_ORIGINS: z.string().min(1).optional(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  /** Android OAuth client ID — optional; required for Play Store ID tokens (aud = Android client). */
  GOOGLE_ANDROID_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().default('qwen/qwen3-32b'),
  VECTOR_SEARCH_INDEX_NAME: z.string().default('document_embedding_index'),
  HEALTH_ENDPOINTS_ENABLED: z
    .string()
    .optional()
    .transform((val): boolean | undefined => {
      if (val === undefined || val === '') {
        return undefined;
      }
      return val === 'true' || val === '1';
    }),
});

type BaseEnv = z.infer<typeof envSchema>;

export type Env = Omit<BaseEnv, 'HEALTH_ENDPOINTS_ENABLED' | 'CORS_ORIGIN' | 'CORS_ORIGINS'> & {
  HEALTH_ENDPOINTS_ENABLED: boolean;
  CORS_ORIGINS: string[];
};

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    const messages = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');

    console.error('Environment validation failed:\n' + messages);
    process.exit(1);
  }

  const { HEALTH_ENDPOINTS_ENABLED, CORS_ORIGIN, CORS_ORIGINS, ...rest } = result.data;

  let corsOrigins: string[];
  try {
    corsOrigins = parseCorsOriginsInput(CORS_ORIGINS ?? CORS_ORIGIN, rest.NODE_ENV);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Environment validation failed:\n  CORS_ORIGINS: ${message}`);
    process.exit(1);
  }

  return {
    ...rest,
    CORS_ORIGINS: corsOrigins,
    HEALTH_ENDPOINTS_ENABLED:
      HEALTH_ENDPOINTS_ENABLED ?? rest.NODE_ENV !== 'production',
  };
}

export const env = parseEnv();
