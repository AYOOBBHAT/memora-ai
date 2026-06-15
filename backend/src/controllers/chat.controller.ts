import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { ChatMessageInput, ConversationIdParams, ConversationSearchQuery } from '@/types';
import { logChatError } from '@/services/chat.service';
import {
  deleteUserConversation,
  getConversationDetail,
  listUserConversations,
  searchUserConversations,
  sendChatWithPersistence,
} from '@/services/conversation.service';

export const chatHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as ChatMessageInput;

  try {
    const result = await sendChatWithPersistence(req.user!.id, input);
    ApiResponse.success(res, 'Chat response generated', result);
  } catch (error) {
    const userQuestion =
      typeof input.message === 'string' ? input.message.trim() : String(input.message ?? '');
    logChatError({ userQuestion }, error);
    throw error;
  }
});

export const listConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await listUserConversations(req.user!.id);
  ApiResponse.success(res, 'Conversations retrieved successfully', { conversations });
});

export const getConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as ConversationIdParams;
  const detail = await getConversationDetail(req.user!.id, id);
  ApiResponse.success(res, 'Conversation retrieved successfully', detail);
});

export const deleteConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as ConversationIdParams;
  await deleteUserConversation(req.user!.id, id);
  ApiResponse.success(res, 'Conversation deleted successfully');
});

export const searchConversationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as unknown as ConversationSearchQuery;
  const conversations = await searchUserConversations(req.user!.id, q);
  ApiResponse.success(res, 'Conversation search completed successfully', { conversations, query: q });
});
