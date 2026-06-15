import { Router } from 'express';
import {
  chatHandler,
  deleteConversationHandler,
  getConversationHandler,
  listConversationsHandler,
  searchConversationsHandler,
} from '@/controllers/chat.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '@/middleware/validate.middleware';
import {
  chatMessageSchema,
  conversationIdParamSchema,
  conversationSearchQuerySchema,
} from '@/validators/chat.validator';

const router = Router();

router.post('/', authenticate, validate(chatMessageSchema), chatHandler);
router.get('/conversations', authenticate, listConversationsHandler);
router.get(
  '/conversations/search',
  authenticate,
  validateQuery(conversationSearchQuerySchema),
  searchConversationsHandler,
);
router.get(
  '/conversations/:id',
  authenticate,
  validateParams(conversationIdParamSchema),
  getConversationHandler,
);
router.delete(
  '/conversations/:id',
  authenticate,
  validateParams(conversationIdParamSchema),
  deleteConversationHandler,
);

export default router;
