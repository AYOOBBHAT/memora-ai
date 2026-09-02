import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    GROQ_API_KEY: 'gsk_test_key',
    GROQ_MODEL: 'openai/gpt-oss-120b',
    GROQ_MAX_COMPLETION_TOKENS: 1024,
    RAG_MAX_CONTEXT_TOKENS: 24_000,
  },
}));

const createMock = vi.fn();

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = {
      completions: {
        create: (...args: unknown[]) => createMock(...args),
      },
    };
  },
}));

import { generateAnswerFromContext, groqChatCompletionParams } from '@/services/groq.service';

describe('groqChatCompletionParams', () => {
  it('sets max_completion_tokens to 1024 without changing reasoning settings', () => {
    const params = groqChatCompletionParams([{ role: 'user', content: 'Say hello' }]);

    expect(params.max_completion_tokens).toBe(1024);
    expect(params.include_reasoning).toBe(false);
    expect(params.reasoning_effort).toBe('low');
    expect(params.model).toBe('openai/gpt-oss-120b');
  });
});

describe('generateAnswerFromContext', () => {
  beforeEach(() => {
    createMock.mockReset();
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'Grounded answer.' } }],
    });
  });

  it('sends max_completion_tokens 1024 on the Groq request', async () => {
    await generateAnswerFromContext('<document index="1">\n<title>Note</title>\n<content>\nHi\n</content>\n</document>', 'What?');

    expect(createMock).toHaveBeenCalledTimes(1);
    const payload = createMock.mock.calls[0]?.[0] as { max_completion_tokens?: number };
    expect(payload.max_completion_tokens).toBe(1024);
  });
});
