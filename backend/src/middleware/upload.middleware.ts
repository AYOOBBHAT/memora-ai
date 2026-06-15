import { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';

import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';

export const PDF_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PDF_MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      callback(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Only application/pdf files are allowed'));
      return;
    }

    callback(null, true);
  },
});

export const uploadPdfMiddleware = pdfUpload.single('file');

export function handleUploadError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'PDF file exceeds 10MB limit'));
      return;
    }

    next(new ApiError(HTTP_STATUS.BAD_REQUEST, err.message));
    return;
  }

  next(err);
}
