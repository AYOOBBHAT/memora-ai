import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';
import pino from 'pino';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';
import { safeErrorLogFields } from '@/utils/safeLog';
import { stripThinkingTags } from '@/utils/stripThinkingTags';
import {
  groqInputCharacterCount,
  maxInputCharactersForTokenBudget,
} from '@/services/ragContextBudget';
import { RAG_SYSTEM_PROMPT, buildGroqUserPrompt } from '@/services/ragPrompt';

const logger = pino({ name: 'groq' });

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

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Shared Chat Completions params. Model stays configuration-driven (`env.GROQ_MODEL`).
 *
 * GPT-OSS on Groq does not support `reasoning_format`. Reasoning defaults into
 * `message.reasoning`; `include_reasoning: false` keeps it out of the payload so
 * users only see `message.content`. `reasoning_effort: "low"` fits RAG over
 * retrieved context (concise, grounded answers with lower latency) without
 * disabling reasoning entirely.
 *
 * `max_completion_tokens` defaults to 1024: RAG answers are prompted to stay
 * concise, and leaving this unset would allow up to 65,536 completion tokens.
 */
export function groqChatCompletionParams(
  messages: ChatCompletionCreateParamsNonStreaming['messages'],
): ChatCompletionCreateParamsNonStreaming {
  return {
    model: env.GROQ_MODEL,
    messages,
    include_reasoning: false,
    reasoning_effort: 'low',
    max_completion_tokens: env.GROQ_MAX_COMPLETION_TOKENS,
  };
}

function logGroqError(
  context: { questionLength: number; contextLength: number; estimatedInputTokens?: number },
  error: unknown,
): void {
  const err = normalizeError(error);
  const payload = {
    ...safeErrorLogFields(error),
    message: err.message,
    model: env.GROQ_MODEL,
    contextLength: context.contextLength,
    questionLength: context.questionLength,
    estimatedInputTokens: context.estimatedInputTokens,
    maxCompletionTokens: env.GROQ_MAX_COMPLETION_TOKENS,
  };

  logger.error(payload, '[GROQ_ERROR] Groq chat request failed');
}

export async function generateAnswerFromContext(
  context: string,
  userQuestion: string,
): Promise<string> {
  const client = getGroqClient();
  const questionLength = userQuestion.length;
  const contextLength = context.length;
  const estimatedInputTokens = Math.ceil(
    groqInputCharacterCount(context, userQuestion) / 4,
  );

  if (!client) {
    const configError = new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Chat is unavailable: GROQ_API_KEY is not configured',
    );
    logGroqError({ questionLength, contextLength, estimatedInputTokens }, configError);
    throw configError;
  }

  if (groqInputCharacterCount(context, userQuestion) > maxInputCharactersForTokenBudget(env.RAG_MAX_CONTEXT_TOKENS)) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'This question retrieved more content than Memora can process. Try a more specific question or a smaller document.',
    );
  }

  const prompt = buildGroqUserPrompt(context, userQuestion);

  try {
    const completion = await client.chat.completions.create(
      groqChatCompletionParams([
        { role: 'system', content: RAG_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]),
    );

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
    if (error instanceof ApiError) {
      throw error;
    }

    logGroqError({ questionLength, contextLength, estimatedInputTokens }, error);
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

  const completion = await client.chat.completions.create(
    groqChatCompletionParams([{ role: 'user', content: 'Say hello' }]),
  );

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
