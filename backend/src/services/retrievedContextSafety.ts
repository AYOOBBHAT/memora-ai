import { textContainsInstructionLikeContent } from '@/services/untrustedContent';

/**
 * Pre-generation trust layer. Retrieval ranking is left unchanged; this decides
 * which retrieved documents may be packed into Groq context as DATA.
 *
 * Instruction-like documents stay untrusted. They are never treated as factual
 * evidence when a non-instruction document was also retrieved.
 */

export function documentContainsInstructionLikeContent(title: string, content: string): boolean {
  return textContainsInstructionLikeContent(`${title}\n${content}`);
}

/**
 * If any retrieved document is free of instruction-like commands, only those
 * documents are sent to Groq. Instruction-like documents (including planted
 * claims mixed into the same file) cannot override them.
 *
 * If every hit is instruction-like, the hits are kept so Groq still receives
 * untrusted DATA (wrapped as non-evidence) rather than an empty context.
 */
export function selectDocumentsForGeneration<T extends { title: string; content: string }>(
  documents: T[],
): T[] {
  if (documents.length === 0) {
    return [];
  }

  const factual = documents.filter(
    (document) => !documentContainsInstructionLikeContent(document.title, document.content),
  );

  if (factual.length > 0) {
    return factual;
  }

  return documents;
}
