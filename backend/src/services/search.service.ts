import { CollectionModel } from '@/models/Collection.model';
import { DocumentModel, IDocumentDocument } from '@/models/Document.model';
import type { DocumentSourceType, GlobalSearchResponse, GlobalSearchResult } from '@/types';

const DEFAULT_LIMIT = 20;
const MAX_PER_TYPE = 10;
const SNIPPET_CONTEXT = 60;

/** Escapes user input for safe use inside a MongoDB / JavaScript RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contentToString(content: string | Record<string, unknown>): string {
  if (typeof content === 'string') {
    return content;
  }

  return JSON.stringify(content);
}

/** Builds a snippet with surrounding context around the first case-insensitive match. */
export function generateSnippet(text: string, query: string, contextLength = SNIPPET_CONTEXT): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const lowerText = trimmed.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return trimmed.length <= contextLength * 2
      ? trimmed
      : `${trimmed.slice(0, contextLength * 2)}…`;
  }

  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(trimmed.length, matchIndex + query.length + contextLength);
  let snippet = trimmed.slice(start, end);

  if (start > 0) {
    snippet = `…${snippet}`;
  }

  if (end < trimmed.length) {
    snippet = `${snippet}…`;
  }

  return snippet;
}

function buildDocumentResult(
  doc: IDocumentDocument,
  query: string,
  regex: RegExp,
): GlobalSearchResult {
  const titleMatch = regex.test(doc.title);
  const contentText = contentToString(doc.content);
  const matchField: 'title' | 'content' = titleMatch ? 'title' : 'content';
  const snippetSource = matchField === 'title' ? doc.title : contentText;

  return {
    type: 'document',
    id: doc._id.toString(),
    title: doc.title,
    snippet: generateSnippet(snippetSource, query),
    sourceType: doc.sourceType as DocumentSourceType,
    ...(doc.collectionId ? { collectionId: doc.collectionId.toString() } : {}),
    matchField,
  };
}

function buildCollectionResult(
  collection: {
    _id: { toString(): string };
    name: string;
    description?: string;
  },
  query: string,
  regex: RegExp,
): GlobalSearchResult {
  const nameMatch = regex.test(collection.name);
  const matchField: 'name' | 'description' = nameMatch ? 'name' : 'description';
  const snippetSource =
    matchField === 'name' ? collection.name : (collection.description ?? collection.name);

  return {
    type: 'collection',
    id: collection._id.toString(),
    name: collection.name,
    snippet: generateSnippet(snippetSource, query),
    matchField,
  };
}

/**
 * Keyword search across the authenticated user's documents and collections.
 * Case-insensitive regex match on title/content and name/description respectively.
 */
export async function globalSearch(
  userId: string,
  query: string,
  limit: number = DEFAULT_LIMIT,
): Promise<GlobalSearchResponse> {
  const trimmedQuery = query.trim();
  const perTypeLimit = Math.min(MAX_PER_TYPE, limit);
  const escaped = escapeRegex(trimmedQuery);
  const regexPattern = new RegExp(escaped, 'i');

  const [documents, collections] = await Promise.all([
    DocumentModel.find({
      userId,
      $or: [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(perTypeLimit),
    CollectionModel.find({
      userId,
      $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(perTypeLimit),
  ]);

  const documentResults = documents.map((doc) => buildDocumentResult(doc, trimmedQuery, regexPattern));
  const collectionResults = collections.map((collection) =>
    buildCollectionResult(collection, trimmedQuery, regexPattern),
  );

  const results = [...documentResults, ...collectionResults].slice(0, limit);

  return { results, query: trimmedQuery };
}
