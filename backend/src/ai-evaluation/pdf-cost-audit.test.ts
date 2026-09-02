import { describe, expect, it } from 'vitest';

import {
  FIRST_PAGE_TOKEN,
  LAST_PAGE_TOKEN,
  MIDDLE_PAGE_TOKEN,
  UNCOMMON_TERM,
  buildOversizedPdf,
  buildSyntheticPdf,
} from '@/ai-evaluation/syntheticPdf';
import { PDF_MAX_FILE_SIZE_BYTES } from '@/middleware/upload.middleware';
import { extractTextFromPdf } from '@/services/pdf.service';
import { RAG_SYSTEM_PROMPT, buildGroqUserPrompt, formatRetrievedDocuments } from '@/services/ragPrompt';
import {
  groqInputCharacterCount,
  maxInputCharactersForTokenBudget,
  packRetrievedDocumentsForGroq,
} from '@/services/ragContextBudget';
import { env } from '@/config/env';

const EMBED_CHAR_LIMIT = 8_000;

describe('production document limits', () => {
  it('accepts PDFs up to 10MB at the multer boundary', () => {
    expect(PDF_MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('builds an oversized buffer above the multer limit', () => {
    const oversized = buildOversizedPdf(PDF_MAX_FILE_SIZE_BYTES + 2048);
    expect(oversized.length).toBeGreaterThan(PDF_MAX_FILE_SIZE_BYTES);
  });
});

describe('synthetic PDF extraction (isolated, real pdf-parse)', () => {
  it('extracts first, middle, last, table, and uncommon tokens from a 15-page PDF', async () => {
    const pdf = buildSyntheticPdf(15, { charsPerPage: 320 });
    const result = await extractTextFromPdf(pdf);

    expect(result.status).toBe('success');
    expect(result.pageCount).toBe(15);
    expect(result.text).toContain(FIRST_PAGE_TOKEN);
    expect(result.text).toContain(MIDDLE_PAGE_TOKEN);
    expect(result.text).toContain(LAST_PAGE_TOKEN);
    expect(result.text).toContain(UNCOMMON_TERM);
    expect(result.text).toMatch(/Users\s*\|\s*12\s*\|\s*18/);
  });
});

describe('whole-document embedding vs Groq context (audit)', () => {
  it('shows last-page tokens fall outside the 8k embedding window on a 50-page PDF', async () => {
    const pdf = buildSyntheticPdf(50, { charsPerPage: 480 });
    const result = await extractTextFromPdf(pdf);

    expect(result.status).toBe('success');
    expect(result.text).toBeTruthy();
    const text = result.text!;
    expect(text.length).toBeGreaterThan(EMBED_CHAR_LIMIT);
    expect(text.indexOf(FIRST_PAGE_TOKEN)).toBeGreaterThanOrEqual(0);
    expect(text.indexOf(FIRST_PAGE_TOKEN)).toBeLessThan(EMBED_CHAR_LIMIT);
    expect(text.indexOf(LAST_PAGE_TOKEN)).toBeGreaterThanOrEqual(EMBED_CHAR_LIMIT);
  });

  it('sends full retrieved bodies to Groq when they fit the context budget, not the 8k embedding slice', () => {
    const body = 'Z'.repeat(20_000);
    const packed = packRetrievedDocumentsForGroq(
      [{ id: '1', title: 'Big', sourceType: 'pdf', content: body }],
      'Where is the tail?',
      env.RAG_MAX_CONTEXT_TOKENS,
    );

    expect(packed.context).toContain(body);
    expect(packed.context.length).toBeGreaterThan(EMBED_CHAR_LIMIT);
    expect(buildGroqUserPrompt(packed.context, 'Where is the tail?')).toContain(body);
  });

  it('packs five large retrieved documents under the configured RAG input budget', () => {
    const oneDoc = 'Large retrieved document. '.repeat(12_000);
    const packed = packRetrievedDocumentsForGroq(
      Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        title: `Doc ${i + 1}`,
        sourceType: 'pdf',
        content: oneDoc,
      })),
      'Summarize the last section.',
      env.RAG_MAX_CONTEXT_TOKENS,
    );

    expect(groqInputCharacterCount(packed.context, 'Summarize the last section.')).toBeLessThanOrEqual(
      maxInputCharactersForTokenBudget(env.RAG_MAX_CONTEXT_TOKENS),
    );
    expect(packed.estimatedInputTokens).toBeLessThanOrEqual(env.RAG_MAX_CONTEXT_TOKENS);
    expect(formatRetrievedDocuments([{ id: '1', title: 'Doc 1', sourceType: 'pdf', content: oneDoc }])).toBeTruthy();
    expect(RAG_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });
});
