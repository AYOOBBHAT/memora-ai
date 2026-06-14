import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  createDocumentHandler,
  updateDocumentHandler,
  retryDocumentEmbeddingHandler,
  deleteDocumentHandler,
  searchDocumentsHandler,
} from '@/controllers/document.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams } from '@/middleware/validate.middleware';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
  searchDocumentsSchema,
} from '@/validators/document.validator';

const router = Router();

router.get('/', authenticate, getDocuments);
router.post('/', authenticate, validate(createDocumentSchema), createDocumentHandler);
router.post('/search', authenticate, validate(searchDocumentsSchema), searchDocumentsHandler);
router.get(
  '/:id',
  authenticate,
  validateParams(documentIdParamSchema),
  getDocument,
);
router.put(
  '/:id',
  authenticate,
  validateParams(documentIdParamSchema),
  validate(updateDocumentSchema),
  updateDocumentHandler,
);
router.post(
  '/:id/retry-embedding',
  authenticate,
  validateParams(documentIdParamSchema),
  retryDocumentEmbeddingHandler,
);
router.delete(
  '/:id',
  authenticate,
  validateParams(documentIdParamSchema),
  deleteDocumentHandler,
);

export default router;
