import pino from 'pino';

import { env } from '@/config/env';

import { extractTextContent } from '@/services/embedding.service';

import { generateAnswerFromContext } from '@/services/groq.service';

import { searchDocumentsBySemanticQuery } from '@/services/vectorSearch.service';

import type { ChatCitationSource, ChatResponse, SafeDocument, ScoredSearchResult } from '@/types';

import { ApiError } from '@/utils/ApiError';

import { HTTP_STATUS } from '@/constants/httpStatus';



const logger = pino({ name: 'chat' });



interface ChatDiagnosticContext {

  userQuestion: string;

  documentCount?: number;

  contextLength?: number;

}



function safeStringify(value: unknown): string {

  try {

    const seen = new WeakSet<object>();



    return JSON.stringify(

      value,

      (_key, val) => {

        if (val instanceof Error) {

          return {

            name: val.name,

            message: val.message,

            stack: val.stack,

            ...(val.cause !== undefined ? { cause: val.cause } : {}),

          };

        }



        if (typeof val === 'object' && val !== null) {

          if (seen.has(val)) {

            return '[Circular]';

          }



          seen.add(val);

        }



        return val;

      },

      2,

    );

  } catch {

    return String(value);

  }

}



function normalizeError(error: unknown): Error {

  return error instanceof Error ? error : new Error(String(error));

}



export function logChatError(context: ChatDiagnosticContext, error: unknown): void {

  const err = normalizeError(error);

  const payload = {

    message: err.message,

    stack: err.stack,

    errorJson: safeStringify(error),

    groqModel: env.GROQ_MODEL,

    documentCount: context.documentCount,

    contextLength: context.contextLength,

    userQuestion: context.userQuestion,

  };



  logger.error(payload, '[CHAT_ERROR] Chat request failed');

  console.error('[CHAT_ERROR]', payload);

}



function logChatDiag(

  step: string,

  context: ChatDiagnosticContext & { model?: string },

): void {

  const payload = { step, ...context };



  logger.info(payload, `[CHAT_DIAG] ${step}`);

  console.log('[CHAT_DIAG]', payload);

}



function toCitationSource(result: ScoredSearchResult): ChatCitationSource {

  return {

    documentId: result.document.id,

    title: result.document.title,

    sourceType: result.document.sourceType,

    score: result.score,

  };

}



function buildContextFromDocuments(documents: SafeDocument[]): string {

  return documents

    .map((doc, index) => {

      const content = extractTextContent(doc.content);

      const metadataLine = doc.metadata

        ? `Metadata: ${JSON.stringify(doc.metadata)}\n`

        : '';



      return `[Document ${index + 1}]

ID: ${doc.id}

Title: ${doc.title}

Source Type: ${doc.sourceType}

${metadataLine}Content:

${content}`;

    })

    .join('\n\n---\n\n');

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

 */

export async function generateRagAnswer(

  userId: string,

  message: string,

  collectionIds?: string[],

): Promise<ChatResponse> {

  if (!userId) {

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authenticated user is required');

  }



  const trimmedMessage = message.trim();



  if (!trimmedMessage) {

    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Message cannot be empty');

  }



  const searchResults = await searchDocumentsBySemanticQuery(

    userId,

    trimmedMessage,

    5,

    collectionIds,

  );



  if (searchResults.length === 0) {

    return noDocumentsAnswer();

  }



  const diagnosticContext: ChatDiagnosticContext = {

    userQuestion: trimmedMessage,

    documentCount: searchResults.length,

  };



  logChatDiag('after_vector_search', diagnosticContext);



  const documents = searchResults.map((result) => result.document);

  const context = buildContextFromDocuments(documents);



  diagnosticContext.contextLength = context.length;

  logChatDiag('after_context_build', diagnosticContext);



  logChatDiag('before_groq', {

    ...diagnosticContext,

    model: env.GROQ_MODEL,

  });



  const answer = await generateAnswerFromContext(context, trimmedMessage);



  return {

    answer,

    sources: searchResults.map(toCitationSource),

  };

}


