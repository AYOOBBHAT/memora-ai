import Groq from 'groq-sdk';
import pino from 'pino';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';
import { stripThinkingTags } from '@/utils/stripThinkingTags';

const logger = pino({ name: 'groq' });

const SYSTEM_PROMPT = `You are a helpful assistant for Memora AI. Answer the user's question ONLY using the provided context from their personal documents.

Rules:
- Use only information present in the context. Do not use outside knowledge or invent facts.
- If the context does not contain enough information to answer, say so clearly.
- When you can answer, cite which document title(s) support your response.
- Keep answers concise and directly relevant to the question.`;

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }

  return groqClient;
}

function safeStringify(value: unknown): string {
  try {
    const seen = new WeakSet<object>();

    return JSON.stringify(
      value,
      (_key, val) => {
        if (val instanceof Error) {
          return {
            name: val.name,
            message: val.message,
            stack: val.stack,
            ...(val.cause !== undefined ? { cause: val.cause } : {}),
          };
        }

        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) {
            return '[Circular]';
          }

          seen.add(val);
        }

        return val;
      },
      2,
    );
  } catch {
    return String(value);
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function logGroqError(
  context: { userQuestion: string; contextLength: number },
  error: unknown,
): void {
  const err = normalizeError(error);
  const payload = {
    message: err.message,
    stack: err.stack,
    errorJson: safeStringify(error),
    model: env.GROQ_MODEL,
    contextLength: context.contextLength,
    userQuestion: context.userQuestion,
  };

  logger.error(payload, '[GROQ_ERROR] Groq chat request failed');
  console.error('[GROQ_ERROR]', payload);
}

export async function generateAnswerFromContext(
  context: string,
  userQuestion: string,
): Promise<string> {
  const client = getGroqClient();

  if (!client) {
    const configError = new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Chat is unavailable: GROQ_API_KEY is not configured',
    );
    logGroqError({ userQuestion, contextLength: context.length }, configError);
    throw configError;
  }

  const prompt = `Context from retrieved documents:

${context}

---

User question: ${userQuestion}`;

  try {
    const completion = await client.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });

    const rawAnswer = completion.choices[0]?.message?.content;

    if (!rawAnswer?.trim()) {
      throw new Error('Empty response from Groq chat model');
    }

    const answer = stripThinkingTags(rawAnswer);

    if (!answer) {
      throw new Error('Empty response from Groq chat model');
    }

    return answer;
  } catch (error) {
    logGroqError({ userQuestion, contextLength: context.length }, error);
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to generate chat response. Please try again later.',
    );
  }
}

export async function generateGroqHealthCheckResponse(): Promise<string> {
  const client = getGroqClient();

  if (!client) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const completion = await client.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [{ role: 'user', content: 'Say hello' }],
  });

  const rawResponse = completion.choices[0]?.message?.content;

  if (!rawResponse?.trim()) {
    throw new Error('Empty response from Groq chat model');
  }

  const response = stripThinkingTags(rawResponse);

  if (!response) {
    throw new Error('Empty response from Groq chat model');
  }

  return response;
}
