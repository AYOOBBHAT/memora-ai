import { Router } from 'express';
import { chatHandler } from '@/controllers/chat.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { chatMessageSchema } from '@/validators/chat.validator';

const router = Router();

router.post('/', authenticate, validate(chatMessageSchema), chatHandler);

export default router;
