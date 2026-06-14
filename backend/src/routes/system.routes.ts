import { Router } from 'express';
import { chatHealthHandler } from '@/controllers/system.controller';
import { secureHealthAccess } from '@/middleware/healthAccess.middleware';

const router = Router();

router.get('/chat-health', secureHealthAccess, chatHealthHandler);

export default router;
