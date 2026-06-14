import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { ChatMessageInput } from '@/types';
import { generateRagAnswer, logChatError } from '@/services/chat.service';

export const chatHandler = asyncHandler(async (req: Request, res: Response) => {
  const { message, collectionIds } = req.body as ChatMessageInput;

  try {
    const result = await generateRagAnswer(req.user!.id, message, collectionIds);
    ApiResponse.success(res, 'Chat response generated', result);
  } catch (error) {
    const userQuestion = typeof message === 'string' ? message.trim() : String(message ?? '');
    logChatError({ userQuestion }, error);
    throw error;
  }
});
