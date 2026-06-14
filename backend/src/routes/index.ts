import { Router } from 'express';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';
import documentRoutes from '@/routes/document.routes';
import collectionRoutes from '@/routes/collection.routes';
import chatRoutes from '@/routes/chat.routes';
import systemRoutes from '@/routes/system.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/system', systemRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/collections', collectionRoutes);
router.use('/chat', chatRoutes);

export default router;
