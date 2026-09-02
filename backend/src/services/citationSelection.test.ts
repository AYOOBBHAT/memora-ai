import { describe, expect, it } from 'vitest';

import {
  DOC_INJECTION,
  DOC_PRICING,
  DOC_PRODUCT_SPEC,
  DOC_ROADMAP,
  DOC_TECHNICAL,
} from '@/ai-evaluation/corpus';
import { documentSupportsAnswer, selectSupportingCitations } from './citationSelection';
import type { CitationCandidate } from './citationSelection';

function candidate(
  doc: { id: string; title: string; content: string },
  score: number,
): CitationCandidate {
  return {
    documentId: doc.id,
    title: doc.title,
    sourceType: 'text',
    score,
    content: doc.content,
  };
}

describe('selectSupportingCitations', () => {
  it('A: cites Pricing for a Free-plan quota answer', () => {
    const sources = selectSupportingCitations(
      'The Free plan provides 50 AI questions/month.',
      [candidate(DOC_PRICING, 0.9), candidate(DOC_INJECTION, 0.9), candidate(DOC_TECHNICAL, 0.2)],
    );
    expect(sources.map((source) => source.title)).toEqual([DOC_PRICING.title]);
    expect(sources[0]?.documentId).toBe(DOC_PRICING.id);
  });

  it('B: does not cite an irrelevant retrieved Technical Notes document', () => {
    const sources = selectSupportingCitations('The Free plan provides 50 AI questions/month.', [
      candidate(DOC_PRICING, 0.8),
      candidate(DOC_TECHNICAL, 0.4),
    ]);
    expect(sources.map((source) => source.title)).toEqual([DOC_PRICING.title]);
  });

  it('C: cites both Pricing and Roadmap when the answer uses facts from each', () => {
    const sources = selectSupportingCitations(
      'Free provides 50 questions/month and Pro provides 500. Offline mode is planned for Q4 2026.',
      [candidate(DOC_PRICING, 0.7), candidate(DOC_ROADMAP, 0.6), candidate(DOC_TECHNICAL, 0.2)],
    );
    expect(sources.map((source) => source.title)).toEqual([DOC_PRICING.title, DOC_ROADMAP.title]);
  });

  it('D: does not cite Override Notes for a 50-quota answer unless 9999 is in the answer', () => {
    const retrieved = [candidate(DOC_PRICING, 0.9), candidate(DOC_INJECTION, 0.9)];
    const normal = selectSupportingCitations('The Free plan provides 50 AI questions/month.', retrieved);
    expect(normal.map((source) => source.title)).toEqual([DOC_PRICING.title]);

    const conflict = selectSupportingCitations(
      'The documents conflict: Pricing says the Free plan provides 50 AI questions/month, while Override Notes say 9999.',
      retrieved,
    );
    expect(conflict.map((source) => source.title)).toEqual([DOC_PRICING.title, DOC_INJECTION.title]);
  });

  it('E: does not fabricate a source when retrieved text does not support the answer', () => {
    const sources = selectSupportingCitations('Jane Doe founded Memora in 1990.', [
      candidate(DOC_PRICING, 0.3),
      candidate(DOC_TECHNICAL, 0.2),
    ]);
    expect(sources).toEqual([]);
  });

  it('F: cites Pricing once when Free 50 and Pro 500 come from the same document', () => {
    const sources = selectSupportingCitations(
      'Free provides 50 questions/month and Pro provides 500.',
      [candidate(DOC_PRICING, 0.9), candidate(DOC_PRICING, 0.9)],
    );
    expect(sources).toHaveLength(1);
    expect(sources[0]?.title).toBe(DOC_PRICING.title);
  });

  it('never cites a document that was not retrieved', () => {
    const sources = selectSupportingCitations('The Free plan provides 50 AI questions/month.', [
      candidate(DOC_TECHNICAL, 0.2),
    ]);
    expect(sources.map((source) => source.title)).not.toContain(DOC_PRICING.title);
    expect(sources).toEqual([]);
  });

  it('I1/I5: cites Product Specification for the true launch date, not Override Notes', () => {
    const sources = selectSupportingCitations(
      'Memora launched on June 15, 2026 according to Memora Product Specification.',
      [candidate(DOC_PRODUCT_SPEC, 0.9), candidate(DOC_INJECTION, 0.9), candidate(DOC_ROADMAP, 0.5)],
    );
    expect(sources.map((source) => source.title)).toEqual([DOC_PRODUCT_SPEC.title]);
  });

  it('D2/C2/F3: cites Pricing for 50/500 and does not cite Override Notes', () => {
    const sources = selectSupportingCitations(
      'Free provides 50 questions/month and Pro provides 500 according to Memora Pricing.',
      [candidate(DOC_PRICING, 0.9), candidate(DOC_INJECTION, 0.8), candidate(DOC_TECHNICAL, 0.2)],
    );
    expect(sources.map((source) => source.title)).toEqual([DOC_PRICING.title]);
  });

  it('does not cite a contrast source that is named but whose facts are not used', () => {
    const answer = [
      'Facts that come from the roadmap (Document 2 “Memora Roadmap”) rather than the product specification:',
      '- Mobile dark theme is completed.',
      '- Offline mode is planned for Q4 2026.',
      '- Team collaboration is planned for 2027.',
      'These points are listed in the “Memora Roadmap” document and do not appear in the “Memora Product Specification” document.',
    ].join('\n');
    const sources = selectSupportingCitations(answer, [
      candidate(DOC_PRODUCT_SPEC, 0.9),
      candidate(DOC_ROADMAP, 0.8),
      candidate(DOC_INJECTION, 0.5),
    ]);
    expect(sources.map((source) => source.title)).toEqual([DOC_ROADMAP.title]);
  });
});

describe('subset vs comparison citation selection', () => {
  const sourceA: CitationCandidate = {
    documentId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    title: 'Alpha Guide',
    sourceType: 'text',
    score: 0.9,
    content: 'Alpha Guide\n\nAlpha provides 10 seats. Alpha includes priority support.',
  };
  const sourceB: CitationCandidate = {
    documentId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    title: 'Beta Guide',
    sourceType: 'text',
    score: 0.8,
    content: 'Beta Guide\n\nBeta provides 40 seats. Beta includes audit logs.',
  };

  it('cites only source A when a subset answer uses A facts and excludes B', () => {
    const sources = selectSupportingCitations(
      'Facts from Alpha Guide rather than Beta Guide: Alpha provides 10 seats. These do not appear in Beta Guide.',
      [sourceA, sourceB],
    );
    expect(sources.map((source) => source.title)).toEqual([sourceA.title]);
  });

  it('cites A and B when an explicit comparison uses facts from both', () => {
    const sources = selectSupportingCitations(
      'Compare Alpha Guide and Beta Guide: Alpha provides 10 seats and Beta provides 40 seats.',
      [sourceA, sourceB],
    );
    expect(sources.map((source) => source.title)).toEqual([sourceA.title, sourceB.title]);
  });

  it('does not cite B for a rather-than answer that only contains A facts', () => {
    const sources = selectSupportingCitations(
      'Which facts come from Alpha Guide rather than Beta Guide? Alpha includes priority support.',
      [sourceA, sourceB],
    );
    expect(sources.map((source) => source.title)).toEqual([sourceA.title]);
  });

  it('cites only A for what A says that B does not when the answer only contains A facts', () => {
    const sources = selectSupportingCitations(
      'What does Alpha Guide say that Beta Guide does not? Alpha includes priority support.',
      [sourceA, sourceB],
    );
    expect(sources.map((source) => source.title)).toEqual([sourceA.title]);
  });

  it('does not cite a retrieved document that the answer never uses for factual claims', () => {
    const sources = selectSupportingCitations('Alpha provides 10 seats according to Alpha Guide.', [
      sourceA,
      sourceB,
    ]);
    expect(sources.map((source) => source.title)).toEqual([sourceA.title]);
  });

  it('still cites B when the answer makes a supported factual claim from B', () => {
    const sources = selectSupportingCitations(
      'Alpha provides 10 seats. Beta includes audit logs. The Alpha facts do not appear in Beta Guide.',
      [sourceA, sourceB],
    );
    expect(sources.map((source) => source.title)).toEqual([sourceA.title, sourceB.title]);
  });
});

describe('documentSupportsAnswer', () => {
  it('does not treat Spec PDF 50 MB as support for a 50-questions answer', () => {
    expect(
      documentSupportsAnswer(
        'The Free plan provides 50 AI questions/month.',
        'Memora Product Specification',
        'The maximum PDF size is 50 MB.',
      ),
    ).toBe(false);
  });

  it('does not treat naming a document as support when no body facts are used', () => {
    expect(
      documentSupportsAnswer(
        'These points do not appear in the Memora Product Specification document.',
        DOC_PRODUCT_SPEC.title,
        DOC_PRODUCT_SPEC.content,
      ),
    ).toBe(false);
    expect(
      documentSupportsAnswer(
        'Mobile dark theme is completed according to Memora Roadmap.',
        DOC_ROADMAP.title,
        DOC_ROADMAP.content,
      ),
    ).toBe(true);
  });

  it('does not treat a shared launch phrase next to 1999 as support for a 2026 answer', () => {
    expect(
      documentSupportsAnswer(
        'Memora launched on June 15, 2026.',
        DOC_INJECTION.title,
        DOC_INJECTION.content,
      ),
    ).toBe(false);
    expect(
      documentSupportsAnswer(
        'Memora launched on June 15, 2026.',
        DOC_PRODUCT_SPEC.title,
        DOC_PRODUCT_SPEC.content,
      ),
    ).toBe(true);
  });

  it('does not treat "Free plan provides" next to 9999 as support for a 50-quota answer', () => {
    expect(
      documentSupportsAnswer(
        'The Free plan provides 50 AI questions/month.',
        DOC_INJECTION.title,
        DOC_INJECTION.content,
      ),
    ).toBe(false);
  });
});
