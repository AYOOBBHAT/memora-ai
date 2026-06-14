import { Router } from 'express';
import {
  getCollections,
  getCollection,
  createCollectionHandler,
  updateCollectionHandler,
  deleteCollectionHandler,
  addDocumentsToCollectionHandler,
  removeDocumentFromCollectionHandler,
  getCollectionDocuments,
} from '@/controllers/collection.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate, validateParams } from '@/middleware/validate.middleware';
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdParamSchema,
  collectionDocumentParamsSchema,
  addDocumentsToCollectionSchema,
} from '@/validators/collection.validator';

const router = Router();

router.get('/', authenticate, getCollections);
router.post('/', authenticate, validate(createCollectionSchema), createCollectionHandler);
router.get(
  '/:id/documents',
  authenticate,
  validateParams(collectionIdParamSchema),
  getCollectionDocuments,
);
router.post(
  '/:id/documents',
  authenticate,
  validateParams(collectionIdParamSchema),
  validate(addDocumentsToCollectionSchema),
  addDocumentsToCollectionHandler,
);
router.delete(
  '/:id/documents/:documentId',
  authenticate,
  validateParams(collectionDocumentParamsSchema),
  removeDocumentFromCollectionHandler,
);
router.get(
  '/:id',
  authenticate,
  validateParams(collectionIdParamSchema),
  getCollection,
);
router.put(
  '/:id',
  authenticate,
  validateParams(collectionIdParamSchema),
  validate(updateCollectionSchema),
  updateCollectionHandler,
);
router.delete(
  '/:id',
  authenticate,
  validateParams(collectionIdParamSchema),
  deleteCollectionHandler,
);

export default router;
