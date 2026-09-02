import type { ChatCitationSource, DocumentSourceType } from '@/types';

/**
 * Deterministic citation selection after RAG generation.
 * Only retrieved documents may be cited. A hit is cited when the answer
 * actually uses evidence from that document — not merely because it was retrieved.
 */

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'according',
  'be',
  'by',
  'can',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'what',
  'when',
  'which',
  'with',
]);

export interface CitationCandidate {
  documentId: string;
  title: string;
  sourceType: DocumentSourceType;
  score: number;
  content: string;
}

export function compactCitationText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function tokenize(text: string): string[] {
  return compactCitationText(text).split(' ').filter(Boolean);
}

function contentTokens(text: string): string[] {
  return tokenize(text).filter((token) => !STOPWORDS.has(token));
}

function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) {
    return [];
  }
  const grams: string[] = [];
  for (let index = 0; index <= tokens.length - n; index += 1) {
    grams.push(tokens.slice(index, index + n).join(' '));
  }
  return grams;
}

function isNumberToken(token: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(token);
}

function neighborOverlapForNumbers(answerTokens: string[], documentTokens: string[], radius = 3): boolean {
  const answerContent = answerTokens.filter((token) => !STOPWORDS.has(token));
  const documentContent = documentTokens.filter((token) => !STOPWORDS.has(token));

  for (let index = 0; index < answerTokens.length; index += 1) {
    const token = answerTokens[index];
    if (!token || !isNumberToken(token)) {
      continue;
    }

    const documentIndexes: number[] = [];
    documentTokens.forEach((documentToken, documentIndex) => {
      if (documentToken === token) {
        documentIndexes.push(documentIndex);
      }
    });
    if (documentIndexes.length === 0) {
      continue;
    }

    const answerNeighbors = new Set(
      answerTokens
        .slice(Math.max(0, index - radius), Math.min(answerTokens.length, index + radius + 1))
        .filter((neighbor) => neighbor !== token && !STOPWORDS.has(neighbor)),
    );

    const hasNearbyOverlap = documentIndexes.some((documentIndex) => {
      const documentNeighbors = documentTokens.slice(
        Math.max(0, documentIndex - radius - 1),
        Math.min(documentTokens.length, documentIndex + radius + 2),
      );
      return [...answerNeighbors].some((neighbor) => documentNeighbors.includes(neighbor));
    });

    if (hasNearbyOverlap) {
      return true;
    }

    const shared = answerContent.filter((item) => item !== token && documentContent.includes(item));
    if (shared.length >= 2) {
      return true;
    }
  }

  return false;
}

function haystackIncludesPhrase(haystack: string, phrase: string): boolean {
  const h = compactCitationText(haystack);
  const n = compactCitationText(phrase);
  if (!n) {
    return false;
  }
  return h.includes(n) || h.replace(/ /g, '').includes(n.replace(/ /g, ''));
}

/**
 * True when the answer uses factual evidence that appears in this document.
 * Title mention alone is not enough. Retrieval score is not used.
 */
export function documentSupportsAnswer(answer: string, title: string, content: string): boolean {
  const trimmedAnswer = answer.trim();
  if (!trimmedAnswer) {
    return false;
  }

  const haystack = `${title}\n${content}`;
  const answerTokens = tokenize(trimmedAnswer);
  const documentTokens = tokenize(haystack);

  if (answerTokens.some(isNumberToken)) {
    return neighborOverlapForNumbers(answerTokens, documentTokens);
  }

  const answerContent = contentTokens(trimmedAnswer);
  const threeGrams = ngrams(answerContent, 3);
  if (threeGrams.some((gram) => haystackIncludesPhrase(haystack, gram))) {
    return true;
  }

  if (answerContent.length < 3) {
    const twoGrams = ngrams(answerContent, 2);
    return twoGrams.some((gram) => haystackIncludesPhrase(haystack, gram));
  }

  return false;
}

/**
 * Selects citations from retrieved candidates only. Dedupes by documentId.
 * Returns [] when nothing retrieved supports the answer (no fabricated sources).
 */
export function selectSupportingCitations(
  answer: string,
  candidates: CitationCandidate[],
): ChatCitationSource[] {
  const selected: ChatCitationSource[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate.documentId || seen.has(candidate.documentId)) {
      continue;
    }
    if (!documentSupportsAnswer(answer, candidate.title, candidate.content)) {
      continue;
    }

    seen.add(candidate.documentId);
    selected.push({
      documentId: candidate.documentId,
      title: candidate.title,
      sourceType: candidate.sourceType,
      score: candidate.score,
    });
  }

  return selected;
}
