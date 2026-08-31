import dotenv from 'dotenv';
import { describe, expect, it } from 'vitest';

dotenv.config();

const runLive = process.env.AI_EVAL_LIVE === '1' && Boolean(process.env.GROQ_API_KEY);

describe.skipIf(!runLive)('live Groq grounding evaluation', () => {
  it(
    'runs the isolated corpus against generateAnswerFromContext and records a baseline',
    async () => {
      const { env } = await import('@/config/env');
      const { generateAnswerFromContext } = await import('@/services/groq.service');
      const { runEvaluation } = await import('./runner');

      const report = await runEvaluation({
        mode: 'live-groq',
        groqModel: env.GROQ_MODEL,
        generate: generateAnswerFromContext,
      });

      expect(report.total).toBeGreaterThanOrEqual(20);
      expect(report.passed + report.failed).toBe(report.total);
      expect(report.mode).toBe('live-groq');
    },
    180_000,
  );
});
