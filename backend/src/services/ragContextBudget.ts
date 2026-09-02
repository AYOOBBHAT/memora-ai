import {
  RAG_SYSTEM_PROMPT,
  buildGroqUserPrompt,
  formatRetrievedDocuments,
  type RetrievedDocumentBlock,
} from '@/services/ragPrompt';
import { selectDocumentsForGeneration } from '@/services/retrievedContextSafety';
import type { RetrievalTurn } from '@/services/retrievalQueryRewrite';

/**
 * Conservative character-to-token ratio used when a GPT-OSS tokenizer is not available.
 * This overestimates relative to English prose more often than it underestimates.
 * Do not treat the result as an exact tokenizer count.
 */
export const RAG_CHARS_PER_TOKEN = 4;

export function estimateTokenCount(text: string): number {
  if (!text) {
    return 0;
  }

  return Math.ceil(text.length / RAG_CHARS_PER_TOKEN);
}

export function groqInputCharacterCount(
  context: string,
  userQuestion: string,
  priorTurns: RetrievalTurn[] = [],
): number {
  return RAG_SYSTEM_PROMPT.length + buildGroqUserPrompt(context, userQuestion, priorTurns).length;
}

export function maxInputCharactersForTokenBudget(maxTokens: number): number {
  return maxTokens * RAG_CHARS_PER_TOKEN;
}

function measurePackedInput(
  documents: RetrievedDocumentBlock[],
  userQuestion: string,
  priorTurns: RetrievalTurn[] = [],
): number {
  return groqInputCharacterCount(formatRetrievedDocuments(documents), userQuestion, priorTurns);
}

function truncateContentToFit(content: string, maxContentChars: number): string {
  if (maxContentChars < 1) {
    return '';
  }

  if (content.length <= maxContentChars) {
    return content;
  }

  const slice = content.slice(0, maxContentChars);
  const lastBreak = Math.max(
    slice.lastIndexOf('\n'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf(' '),
  );

  if (lastBreak >= Math.floor(maxContentChars * 0.5)) {
    return slice.slice(0, lastBreak + 1).trimEnd();
  }

  return slice.trimEnd();
}

export interface PackedGroqContext {
  context: string;
  documents: RetrievedDocumentBlock[];
  estimatedInputTokens: number;
  includedCount: number;
  truncatedContent: boolean;
}

/**
 * Packs retrieved documents into a Groq prompt that never exceeds `maxTokens`
 * estimated input tokens (chars/4 over system + user prompt).
 *
 * Instruction-like documents are omitted when a factual document is also
 * present (see `selectDocumentsForGeneration`). Remaining documents are added
 * in the given (relevance) order. Whole documents are preferred. If one
 * document would overflow the remaining budget, a bounded prefix of its body
 * is included when a safe portion fits; otherwise it is skipped.
 * The final user question, untrusted delimiters, and document tags are always kept.
 */
export function packRetrievedDocumentsForGroq(
  documents: RetrievedDocumentBlock[],
  userQuestion: string,
  maxTokens: number,
  priorTurns: RetrievalTurn[] = [],
): PackedGroqContext {
  const maxChars = maxInputCharactersForTokenBudget(maxTokens);
  const selected: RetrievedDocumentBlock[] = [];
  let truncatedContent = false;

  for (const document of selectDocumentsForGeneration(documents)) {
    const trimmed: RetrievedDocumentBlock = {
      ...document,
      content: document.content.trim(),
    };
    const withFull = [...selected, trimmed];

    if (measurePackedInput(withFull, userQuestion, priorTurns) <= maxChars) {
      selected.push(trimmed);
      continue;
    }

    const selectedChars = measurePackedInput(selected, userQuestion, priorTurns);
    const remaining = maxChars - selectedChars;
    const wrapperChars =
      measurePackedInput([...selected, { ...trimmed, content: '' }], userQuestion, priorTurns) -
      selectedChars;
    let contentBudget = remaining - wrapperChars;

    if (contentBudget < 32) {
      continue;
    }

    let candidate: RetrievedDocumentBlock | null = null;

    while (contentBudget >= 32) {
      const bounded = truncateContentToFit(trimmed.content, contentBudget);
      if (!bounded) {
        break;
      }

      const next = { ...trimmed, content: bounded };
      if (measurePackedInput([...selected, next], userQuestion, priorTurns) <= maxChars) {
        candidate = next;
        break;
      }

      contentBudget = Math.floor(contentBudget * 0.8);
    }

    if (candidate) {
      truncatedContent = truncatedContent || candidate.content.length < trimmed.content.length;
      selected.push(candidate);
    }
  }

  let finalDocs = selected;
  let finalContext = formatRetrievedDocuments(finalDocs);

  while (
    finalDocs.length > 0 &&
    groqInputCharacterCount(finalContext, userQuestion, priorTurns) > maxChars
  ) {
    finalDocs = finalDocs.slice(0, -1);
    finalContext = formatRetrievedDocuments(finalDocs);
  }

  const inputText = `${RAG_SYSTEM_PROMPT}${buildGroqUserPrompt(finalContext, userQuestion, priorTurns)}`;

  return {
    context: finalContext,
    documents: finalDocs,
    estimatedInputTokens: estimateTokenCount(inputText),
    includedCount: finalDocs.length,
    truncatedContent,
  };
}
