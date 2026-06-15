import { Router } from 'express';
import { searchHandler } from '@/controllers/search.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateQuery } from '@/middleware/validate.middleware';
import { globalSearchQuerySchema } from '@/validators/search.validator';

const router = Router();

router.get('/', authenticate, validateQuery(globalSearchQuerySchema), searchHandler);

export default router;
