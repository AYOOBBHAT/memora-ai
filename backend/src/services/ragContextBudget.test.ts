import { describe, expect, it } from 'vitest';

import {
  RAG_CHARS_PER_TOKEN,
  groqInputCharacterCount,
  maxInputCharactersForTokenBudget,
  packRetrievedDocumentsForGroq,
} from '@/services/ragContextBudget';
import { RAG_SYSTEM_PROMPT, buildGroqUserPrompt } from '@/services/ragPrompt';

const MAX_TOKENS = 24_000;
const QUESTION = 'What is the maximum PDF size?';

function doc(id: string, content: string, title = `Doc ${id}`) {
  return { id, title, sourceType: 'pdf' as const, content };
}

describe('packRetrievedDocumentsForGroq', () => {
  it('includes five small documents in relevance order with delimiters and the user question', () => {
    const documents = [
      doc('1', 'Memora launched on June 15, 2026.'),
      doc('2', 'The Free plan provides 50 AI questions/month.'),
      doc('3', 'Vector search uses MongoDB Atlas.'),
      doc('4', 'Offline mode is planned for Q4 2026.'),
      doc('5', 'Supported sources are PDF, Website, YouTube and Notes.'),
    ];

    const packed = packRetrievedDocumentsForGroq(documents, QUESTION, MAX_TOKENS);
    const prompt = buildGroqUserPrompt(packed.context, QUESTION);

    expect(packed.includedCount).toBe(5);
    expect(packed.truncatedContent).toBe(false);
    expect(packed.context).toContain('<document index="1">');
    expect(packed.context).toContain('<document index="5">');
    expect(packed.context).toContain('</document>');
    expect(packed.context).toContain('<title>Doc 1</title>');
    expect(prompt).toContain('<retrieved_documents>');
    expect(prompt).toContain(`User question: ${QUESTION}`);
    expect(packed.estimatedInputTokens).toBeLessThanOrEqual(MAX_TOKENS);
    expect(groqInputCharacterCount(packed.context, QUESTION)).toBeLessThanOrEqual(
      maxInputCharactersForTokenBudget(MAX_TOKENS),
    );
  });

  it('keeps packed large documents under the configured estimated token budget', () => {
    const documents = Array.from({ length: 5 }, (_, i) =>
      doc(String(i + 1), 'Large retrieved document. '.repeat(12_000), `Large ${i + 1}`),
    );

    const packed = packRetrievedDocumentsForGroq(documents, 'Summarize the last section.', MAX_TOKENS);
    const inputChars = groqInputCharacterCount(packed.context, 'Summarize the last section.');

    expect(inputChars).toBeLessThanOrEqual(MAX_TOKENS * RAG_CHARS_PER_TOKEN);
    expect(packed.estimatedInputTokens).toBeLessThanOrEqual(MAX_TOKENS);
    expect(packed.includedCount).toBeGreaterThan(0);
    expect(packed.context).toContain('<document');
    expect(buildGroqUserPrompt(packed.context, 'Summarize the last section.')).toContain(
      '<retrieved_documents>',
    );
    expect(packed.context).toContain('<document index="1">');
    expect(packed.context).not.toMatch(/<document index="1">[^]*<document index="1">/);
  });

  it('preserves whole earlier documents before truncating a later oversized one', () => {
    const packed = packRetrievedDocumentsForGroq(
      [
        doc('small', 'Short fact: launched June 15, 2026.'),
        doc('huge', `${'A'.repeat(200_000)}\nTAIL_SHOULD_NOT_FIT`),
      ],
      QUESTION,
      MAX_TOKENS,
    );

    expect(packed.documents[0]?.id).toBe('small');
    expect(packed.context).toContain('launched June 15, 2026.');
    expect(packed.context).toContain('<id>small</id>');
    expect(packed.estimatedInputTokens).toBeLessThanOrEqual(MAX_TOKENS);
    expect(packed.context).not.toContain('TAIL_SHOULD_NOT_FIT');
  });

  it('never exceeds the character budget that backs the token estimate', () => {
    const packed = packRetrievedDocumentsForGroq(
      [doc('only', 'Z'.repeat(500_000))],
      QUESTION,
      MAX_TOKENS,
    );

    expect(groqInputCharacterCount(packed.context, QUESTION)).toBeLessThanOrEqual(
      maxInputCharactersForTokenBudget(MAX_TOKENS),
    );
    expect(RAG_SYSTEM_PROMPT.length + buildGroqUserPrompt(packed.context, QUESTION).length).toBeLessThanOrEqual(
      maxInputCharactersForTokenBudget(MAX_TOKENS),
    );
  });
});
