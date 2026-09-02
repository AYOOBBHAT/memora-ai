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
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  /** @deprecated Use CORS_ORIGINS. Single origin kept for backward compatibility. */
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL').optional(),
  /** Comma-separated browser origins (https only in production). Native mobile apps omit Origin. */
  CORS_ORIGINS: z.string().min(1).optional(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  /** Android OAuth client ID — optional; required for Play Store ID tokens (aud = Android client). */
  GOOGLE_ANDROID_CLIENT_ID: z.string().min(1).optional(),
  /** Resend API key for transactional email (password reset OTP). */
  RESEND_API_KEY: z.string().min(1).optional(),
  /** Verified sender address in Resend (e.g. Memora <noreply@yourdomain.com>). */
  EMAIL_FROM: z.string().min(3).optional(),
  PASSWORD_RESET_OTP_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(30).default(10),
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(30).max(300).default(60),
  PASSWORD_RESET_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  /**
   * Estimated max Groq input tokens (chars/4) for system + retrieved docs + question.
   * Capped so an env typo cannot reopen the 131k context window.
   */
  RAG_MAX_CONTEXT_TOKENS: z.coerce.number().int().min(4_000).max(32_000).default(24_000),
  /**
   * Groq max_completion_tokens. Default 1024 keeps answers concise and caps cost.
   * Hard-capped at 2048 so an env typo cannot restore 65k completions.
   */
  GROQ_MAX_COMPLETION_TOKENS: z.coerce.number().int().min(256).max(2_048).default(1_024),
  /** PDF page cap after extraction. Cannot be raised above 50. */
  PDF_MAX_PAGES: z.coerce.number().int().min(1).max(50).default(50),
  /** PDF extracted-text cap after extraction. Cannot be raised above 50_000. */
  PDF_MAX_EXTRACTED_CHARS: z.coerce.number().int().min(5_000).max(50_000).default(50_000),
  /** Per-user UTC-day AI (Groq) request cap. Abuse protection, not a billing plan. */
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().min(1).max(200).default(50),
  /** Per-user UTC-day accepted PDF upload cap. Abuse protection, not a billing plan. */
  UPLOAD_DAILY_LIMIT: z.coerce.number().int().min(1).max(50).default(20),
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
