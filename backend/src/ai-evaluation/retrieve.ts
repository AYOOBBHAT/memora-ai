import { EVAL_CORPUS, type EvalDocument } from './corpus';

/** Matches production `DEFAULT_SEARCH_LIMIT` in vectorSearch.service.ts. */
export const EVAL_RETRIEVAL_LIMIT = 5;

export interface EvalRetrievedDocument {
  document: EvalDocument;
  score: number;
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'about',
  'between',
  'can',
  'did',
  'do',
  'does',
  'for',
  'how',
  'in',
  'is',
  'of',
  'on',
  'or',
  'the',
  'them',
  'to',
  'what',
  'when',
  'which',
  'who',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Evaluation-only lexical retriever.
 *
 * Mirrors production scoping (userId filter, top-k=5, no similarity threshold)
 * without calling Atlas or Gemini. Stopwords are eval-only so short function words
 * do not retrieve every document. This is NOT a substitute for production
 * $vectorSearch; it lets the harness classify retrieval vs generation failures
 * without writing to the production database.
 */
export function retrieveEvalDocuments(
  userId: string,
  query: string,
  limit: number = EVAL_RETRIEVAL_LIMIT,
): EvalRetrievedDocument[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const scored = EVAL_CORPUS.filter((doc) => doc.userId === userId).map((document) => {
    const titleTokens = tokenize(document.title);
    const contentTokens = tokenize(document.content);
    let score = 0;

    for (const token of queryTokens) {
      if (titleTokens.includes(token)) {
        score += 3;
      }
      if (contentTokens.includes(token)) {
        score += 1;
      }
    }

    return { document, score };
  });

  return scored
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title))
    .slice(0, Math.min(Math.max(1, limit), EVAL_RETRIEVAL_LIMIT));
}
