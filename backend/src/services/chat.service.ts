import pino from 'pino';

import { env } from '@/config/env';
import { extractTextContent } from '@/services/embedding.service';
import { generateAnswerFromContext } from '@/services/groq.service';
import { packRetrievedDocumentsForGroq } from '@/services/ragContextBudget';
import type { RetrievedDocumentBlock } from '@/services/ragPrompt';
import { consumeAiQuota, releaseAiQuota } from '@/services/quota.service';
import { rewriteRetrievalQuery, type RetrievalTurn } from '@/services/retrievalQueryRewrite';
import { selectSupportingCitations } from '@/services/citationSelection';
import { searchDocumentsForChat } from '@/services/vectorSearch.service';
import type { ChatResponse, SafeDocument } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { safeErrorLogFields } from '@/utils/safeLog';

const logger = pino({ name: 'chat' });

interface ChatDiagnosticContext {
  documentCount?: number;
  packedDocumentCount?: number;
  contextLength?: number;
  estimatedInputTokens?: number;
  truncatedContent?: boolean;
  retrievalRewritten?: boolean;
}

export function logChatError(context: ChatDiagnosticContext, error: unknown): void {
  const payload = {
    ...safeErrorLogFields(error),
    groqModel: env.GROQ_MODEL,
    documentCount: context.documentCount,
    packedDocumentCount: context.packedDocumentCount,
    contextLength: context.contextLength,
    estimatedInputTokens: context.estimatedInputTokens,
  };

  logger.error(payload, '[CHAT_ERROR] Chat request failed');
}

function logChatDiag(step: string, context: ChatDiagnosticContext & { model?: string }): void {
  logger.info({ step, ...context }, `[CHAT_DIAG] ${step}`);
}

function toRetrievedBlocks(documents: SafeDocument[]): RetrievedDocumentBlock[] {
  return documents.map((doc) => {
    const content = extractTextContent(doc.content);
    const metadata = doc.metadata ? `\nMetadata: ${JSON.stringify(doc.metadata)}` : '';

    return {
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      content: `${content}${metadata}`,
    };
  });
}

function noDocumentsAnswer(): ChatResponse {
  return {
    answer:
      "I couldn't find any relevant documents in your knowledge base to answer this question. " +
      'Try adding documents with related content or rephrasing your question.',
    sources: [],
  };
}

/**
 * Generates a RAG answer for a user question using semantic document retrieval
 * and Groq generative chat. User isolation is enforced via `userId` only.
 *
 * @param userId - Authenticated user ID; retrieval is scoped to this user only.
 * @param message - User question or prompt.
 * @param collectionIds - Optional collection IDs to limit retrieval to specific owned collections.
 * @param priorTurns - Optional recent turns from the same owned conversation; used only to rewrite the retrieval query.
 */
export async function generateRagAnswer(
  userId: string,
  message: string,
  collectionIds?: string[],
  priorTurns: RetrievalTurn[] = [],
): Promise<ChatResponse> {
  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authenticated user is required');
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Message cannot be empty');
  }

  const retrievalQuery = rewriteRetrievalQuery(trimmedMessage, priorTurns);

  const searchResults = await searchDocumentsForChat(
    userId,
    retrievalQuery,
    5,
    collectionIds,
  );

  if (searchResults.length === 0) {
    return noDocumentsAnswer();
  }

  const diagnosticContext: ChatDiagnosticContext = {
    documentCount: searchResults.length,
    retrievalRewritten: retrievalQuery !== trimmedMessage,
  };

  logChatDiag('after_vector_search', diagnosticContext);

  const packed = packRetrievedDocumentsForGroq(
    toRetrievedBlocks(searchResults.map((result) => result.document)),
    trimmedMessage,
    env.RAG_MAX_CONTEXT_TOKENS,
  );

  if (packed.includedCount === 0) {
    return noDocumentsAnswer();
  }

  diagnosticContext.packedDocumentCount = packed.includedCount;
  diagnosticContext.contextLength = packed.context.length;
  diagnosticContext.estimatedInputTokens = packed.estimatedInputTokens;
  diagnosticContext.truncatedContent = packed.truncatedContent;

  logChatDiag('after_context_build', diagnosticContext);
  logChatDiag('before_groq', {
    ...diagnosticContext,
    model: env.GROQ_MODEL,
  });

  await consumeAiQuota(userId);

  let answer: string;

  try {
    answer = await generateAnswerFromContext(packed.context, trimmedMessage);
  } catch (error) {
    await releaseAiQuota(userId).catch((releaseError) => {
      logger.error(
        { ...safeErrorLogFields(releaseError), userId },
        'Failed to release AI quota after Groq error',
      );
    });
    throw error;
  }

  const packedById = new Map(packed.documents.map((doc) => [doc.id, doc]));
  const sources = selectSupportingCitations(
    answer,
    searchResults
      .filter((result) => packedById.has(result.document.id))
      .map((result) => ({
        documentId: result.document.id,
        title: result.document.title,
        sourceType: result.document.sourceType,
        score: result.score,
        content: packedById.get(result.document.id)?.content ?? extractTextContent(result.document.content),
      })),
  );

  return {
    answer,
    sources,
  };
}
