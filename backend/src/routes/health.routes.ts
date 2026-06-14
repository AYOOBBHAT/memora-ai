import { Router } from 'express';
import { getHealth, getLiveness } from '@/controllers/health.controller';
import { secureHealthAccess } from '@/middleware/healthAccess.middleware';

const router = Router();

router.get('/live', getLiveness);
router.get('/', secureHealthAccess, getHealth);

export default router;
