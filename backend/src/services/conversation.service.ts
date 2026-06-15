import { Types } from 'mongoose';

import {
  ChatMessageModel,
  IChatMessageDocument,
} from '@/models/ChatMessage.model';
import {
  ConversationModel,
  IConversationDocument,
} from '@/models/Conversation.model';
import { verifyUserCollections } from '@/services/collection.service';
import { generateRagAnswer } from '@/services/chat.service';
import { escapeRegex } from '@/services/search.service';
import { HTTP_STATUS } from '@/constants/httpStatus';
import type {
  ChatCitationSource,
  ChatResponse,
  ConversationDetail,
  ConversationListItem,
  SafeChatMessage,
  SafeConversation,
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import type { ChatMessageInput } from '@/validators/chat.validator';

const TITLE_MAX_LENGTH = 80;

export function deriveConversationTitle(message: string): string {
  const trimmed = message.trim();

  if (trimmed.length <= TITLE_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, TITLE_MAX_LENGTH - 1)}…`;
}

export function toSafeConversation(conversation: IConversationDocument): SafeConversation {
  return {
    id: conversation._id.toString(),
    userId: conversation.userId.toString(),
    title: conversation.title,
    collectionIds: conversation.collectionIds?.map((id) => id.toString()),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function toSafeChatMessage(message: IChatMessageDocument): SafeChatMessage {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    userId: message.userId.toString(),
    role: message.role,
    content: message.content,
    citations: message.citations,
    timestamp: message.timestamp,
  };
}

async function getOwnedConversation(
  userId: string,
  conversationId: string,
): Promise<IConversationDocument> {
  const conversation = await ConversationModel.findOne({ _id: conversationId, userId });

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }

  return conversation;
}

async function enrichConversationListItems(
  conversations: IConversationDocument[],
): Promise<ConversationListItem[]> {
  if (conversations.length === 0) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation._id);

  const [messageCounts, lastMessages] = await Promise.all([
    ChatMessageModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { conversationId: { $in: conversationIds } } },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]),
    ChatMessageModel.aggregate<{ _id: Types.ObjectId; content: string }>([
      { $match: { conversationId: { $in: conversationIds } } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$conversationId',
          content: { $first: '$content' },
        },
      },
    ]),
  ]);

  const countByConversationId = new Map(
    messageCounts.map((entry) => [entry._id.toString(), entry.count]),
  );
  const previewByConversationId = new Map(
    lastMessages.map((entry) => [entry._id.toString(), entry.content]),
  );

  return conversations.map((conversation) => {
    const id = conversation._id.toString();
    const preview = previewByConversationId.get(id) ?? '';
    const messageCount = countByConversationId.get(id) ?? 0;

    return {
      id,
      title: conversation.title,
      preview: preview.length > 120 ? `${preview.slice(0, 119)}…` : preview,
      messageCount,
      updatedAt: conversation.updatedAt,
    };
  });
}

export async function listUserConversations(userId: string): Promise<ConversationListItem[]> {
  const conversations = await ConversationModel.find({ userId }).sort({ updatedAt: -1 });
  return enrichConversationListItems(conversations);
}

export async function getConversationDetail(
  userId: string,
  conversationId: string,
): Promise<ConversationDetail> {
  const conversation = await getOwnedConversation(userId, conversationId);
  const messages = await ChatMessageModel.find({ conversationId, userId }).sort({ timestamp: 1 });

  return {
    conversation: toSafeConversation(conversation),
    messages: messages.map(toSafeChatMessage),
  };
}

export async function deleteUserConversation(userId: string, conversationId: string): Promise<void> {
  const conversation = await ConversationModel.findOneAndDelete({ _id: conversationId, userId });

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');
  }

  await ChatMessageModel.deleteMany({ conversationId, userId });
}

export async function searchUserConversations(
  userId: string,
  query: string,
): Promise<ConversationListItem[]> {
  const regex = new RegExp(escapeRegex(query), 'i');

  const matchingConversationIds = await ChatMessageModel.find({
    userId,
    content: regex,
  }).distinct('conversationId');

  const conversations = await ConversationModel.find({
    userId,
    $or: [{ title: regex }, { _id: { $in: matchingConversationIds } }],
  }).sort({ updatedAt: -1 });

  return enrichConversationListItems(conversations);
}

export interface PersistedChatResponse extends ChatResponse {
  conversationId: string;
  messageId: string;
}

export async function sendChatWithPersistence(
  userId: string,
  input: ChatMessageInput,
): Promise<PersistedChatResponse> {
  const { message, collectionIds, conversationId } = input;
  const now = new Date();

  if (collectionIds?.length) {
    await verifyUserCollections(userId, collectionIds);
  }

  let conversation: IConversationDocument;

  if (conversationId) {
    conversation = await getOwnedConversation(userId, conversationId);

    if (collectionIds?.length) {
      conversation.collectionIds = collectionIds.map((id) => new Types.ObjectId(id));
      await conversation.save();
    }
  } else {
    conversation = await ConversationModel.create({
      userId,
      title: deriveConversationTitle(message),
      collectionIds: collectionIds?.map((id) => new Types.ObjectId(id)),
    });
  }

  const storedCollectionIds = conversation.collectionIds?.map((id) => id.toString());
  const effectiveCollectionIds = collectionIds?.length
    ? collectionIds
    : storedCollectionIds?.length
      ? storedCollectionIds
      : undefined;

  await ChatMessageModel.create({
    conversationId: conversation._id,
    userId,
    role: 'user',
    content: message,
    timestamp: now,
  });

  const ragResult = await generateRagAnswer(userId, message, effectiveCollectionIds);

  const assistantMessage = await ChatMessageModel.create({
    conversationId: conversation._id,
    userId,
    role: 'assistant',
    content: ragResult.answer,
    citations: ragResult.sources as ChatCitationSource[],
    timestamp: new Date(),
  });

  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    ...ragResult,
    conversationId: conversation._id.toString(),
    messageId: assistantMessage._id.toString(),
  };
}
