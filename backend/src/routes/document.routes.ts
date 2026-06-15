import { Router } from 'express';
import {
  getDocuments,
  getDocument,
  createDocumentHandler,
  uploadPdfHandler,
  importUrlHandler,
  updateDocumentHandler,
  retryDocumentEmbeddingHandler,
  deleteDocumentHandler,
  searchDocumentsHandler,
} from '@/controllers/document.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { handleUploadError, uploadPdfMiddleware } from '@/middleware/upload.middleware';
import { validate, validateParams, validateUploadFields } from '@/middleware/validate.middleware';
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
  searchDocumentsSchema,
  uploadPdfFieldsSchema,
  importUrlSchema,
} from '@/validators/document.validator';

const router = Router();

router.get('/', authenticate, getDocuments);
router.post('/', authenticate, validate(createDocumentSchema), createDocumentHandler);
router.post(
  '/upload-pdf',
  authenticate,
  (req, res, next) => {
    uploadPdfMiddleware(req, res, (err) => {
      if (err) {
        handleUploadError(err, req, res, next);
        return;
      }

      next();
    });
  },
  validateUploadFields(uploadPdfFieldsSchema),
  uploadPdfHandler,
);
router.post('/import-url', authenticate, validate(importUrlSchema), importUrlHandler);
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
