import { describe, expect, it } from 'vitest';

import {
  looksLikeFollowUp,
  rewriteRetrievalQuery,
  selectTurnsForRetrieval,
  type RetrievalTurn,
} from './retrievalQueryRewrite';

describe('looksLikeFollowUp', () => {
  it('does not rewrite standalone factual questions', () => {
    expect(looksLikeFollowUp('What is the maximum PDF size?')).toBe(false);
    expect(looksLikeFollowUp('What sources does Memora support?')).toBe(false);
    expect(looksLikeFollowUp('Tell me about MongoDB Atlas.')).toBe(false);
    expect(looksLikeFollowUp('How large can a PDF be?')).toBe(false);
  });

  it('detects deictic and fragment follow-ups', () => {
    expect(looksLikeFollowUp('What about Pro?')).toBe(true);
    expect(looksLikeFollowUp("What's the difference between them?")).toBe(true);
    expect(looksLikeFollowUp("What's the difference?")).toBe(true);
    expect(looksLikeFollowUp('When will that be available?')).toBe(true);
    expect(looksLikeFollowUp('Does it support that?')).toBe(true);
    expect(looksLikeFollowUp('And offline?')).toBe(true);
    expect(looksLikeFollowUp('What about Android?')).toBe(true);
    expect(looksLikeFollowUp('What about the other one?')).toBe(true);
    expect(looksLikeFollowUp('What sources does it support?')).toBe(true);
  });
});

describe('rewriteRetrievalQuery', () => {
  it('A: leaves a direct question unchanged', () => {
    expect(
      rewriteRetrievalQuery('What is the maximum PDF size?', [
        { role: 'user', content: 'How many AI questions does the Free plan provide?' },
      ]),
    ).toBe('What is the maximum PDF size?');
  });

  it('B: follow-up about Pro includes the prior Free-plan question', () => {
    const query = rewriteRetrievalQuery('What about Pro?', [
      { role: 'user', content: 'How many AI questions does Free provide?' },
    ]);
    expect(query.toLowerCase()).toContain('pro');
    expect(query.toLowerCase()).toContain('free');
    expect(query).toContain('How many AI questions does Free provide?');
  });

  it('C: preserves offline-mode from the previous assistant answer', () => {
    const query = rewriteRetrievalQuery('When will that be available?', [
      { role: 'assistant', content: 'Offline mode is planned for Q4 2026.' },
    ]);
    expect(query.toLowerCase()).toContain('offline');
    expect(query).toContain('Q4 2026');
  });

  it('D: comparison follow-up identifies Free vs Pro quotas', () => {
    const query = rewriteRetrievalQuery("What's the difference?", [
      {
        role: 'assistant',
        content: 'Free provides 50 questions/month and Pro provides 500.',
      },
    ]);
    expect(query.toLowerCase()).toContain('free');
    expect(query.toLowerCase()).toContain('pro');
    expect(query).toMatch(/50|500|quota|question/i);
  });

  it('E: multi-turn source follow-ups stay coherent', () => {
    const turns: RetrievalTurn[] = [
      { role: 'user', content: 'What is Memora?' },
      { role: 'user', content: 'What sources does it support?' },
    ];
    const youtube = rewriteRetrievalQuery('What about YouTube?', turns);
    expect(youtube.toLowerCase()).toContain('youtube');
    expect(youtube.toLowerCase()).toMatch(/source|memora/);
  });

  it('F: does not contaminate an unrelated new question', () => {
    const query = rewriteRetrievalQuery('How large can a PDF be?', [
      { role: 'user', content: 'What are the Free and Pro quotas?' },
    ]);
    expect(query).toBe('How large can a PDF be?');
    expect(query.toLowerCase()).not.toContain('free');
    expect(query.toLowerCase()).not.toContain('pro');
  });

  it('uses at most two user turns and one assistant turn', () => {
    const selected = selectTurnsForRetrieval([
      { role: 'assistant', content: 'Latest assistant' },
      { role: 'user', content: 'User 3' },
      { role: 'assistant', content: 'Older assistant' },
      { role: 'user', content: 'User 2' },
      { role: 'user', content: 'User 1' },
    ]);
    expect(selected.map((turn) => turn.content)).toEqual(['User 2', 'User 3', 'Latest assistant']);
  });
});
