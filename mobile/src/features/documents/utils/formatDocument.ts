import type { SafeDocument } from '../../../api/types';

export function formatDocumentContent(content: SafeDocument['content']): string {
  if (typeof content === 'string') {
    return content;
  }

  return JSON.stringify(content, null, 2);
}

export function formatDocumentDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
