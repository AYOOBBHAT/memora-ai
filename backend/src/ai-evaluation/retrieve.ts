import { EVAL_CORPUS, type EvalDocument } from './corpus';
import { deriveRetrievalQueries, mergeScoredHits } from '@/services/untrustedContent';

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
 * Light morphology so eval lexical retrieval can approximate semantic overlap
 * (launch/launched, question/questions) without calling Gemini or Atlas.
 */
function tokenForms(token: string): string[] {
  const forms = new Set([token]);

  if (token.length >= 4 && token.endsWith('s') && !token.endsWith('ss')) {
    forms.add(token.slice(0, -1));
  }
  if (token.length > 5 && token.endsWith('ed')) {
    forms.add(token.slice(0, -2));
  }
  if (token.length > 5 && token.endsWith('ing')) {
    forms.add(token.slice(0, -3));
  }

  return [...forms];
}

function tokenMatches(queryToken: string, documentTokens: string[]): boolean {
  const queryForms = tokenForms(queryToken);
  return documentTokens.some((documentToken) => {
    const documentForms = tokenForms(documentToken);
    return queryForms.some((form) => documentForms.includes(form));
  });
}

function scoreDocument(document: EvalDocument, queryTokens: string[]): number {
  const titleTokens = tokenize(document.title);
  const contentTokens = tokenize(document.content);
  let score = 0;

  for (const token of queryTokens) {
    if (tokenMatches(token, titleTokens)) {
      score += 3;
    }
    if (tokenMatches(token, contentTokens)) {
      score += 1;
    }
  }

  return score;
}

function retrieveOnce(
  userId: string,
  query: string,
  limit: number,
): EvalRetrievedDocument[] {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  return EVAL_CORPUS.filter((doc) => doc.userId === userId)
    .map((document) => ({ document, score: scoreDocument(document, queryTokens) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title))
    .slice(0, Math.min(Math.max(1, limit), EVAL_RETRIEVAL_LIMIT));
}

/**
 * Evaluation-only lexical retriever.
 *
 * Mirrors production scoping (userId filter, top-k=5, no score threshold) and
 * production RAG query expansion for command-wrapped questions. This is NOT
 * Atlas $vectorSearch; it lets the harness classify retrieval vs generation
 * failures without writing to the production database.
 */
export function retrieveEvalDocuments(
  userId: string,
  query: string,
  limit: number = EVAL_RETRIEVAL_LIMIT,
): EvalRetrievedDocument[] {
  const cappedLimit = Math.min(Math.max(1, limit), EVAL_RETRIEVAL_LIMIT);
  const queries = deriveRetrievalQueries(query);
  const groups = queries.map((retrievalQuery) => retrieveOnce(userId, retrievalQuery, cappedLimit));
  return mergeScoredHits(groups, cappedLimit);
}
