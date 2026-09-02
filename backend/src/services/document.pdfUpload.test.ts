import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';

vi.mock('@/models/Document.model', () => ({
  DocumentModel: {
    create: vi.fn(),
  },
}));

vi.mock('@/services/embedding.service', () => ({
  scheduleDocumentEmbedding: vi.fn(),
}));

vi.mock('@/services/quota.service', () => ({
  consumeUploadQuota: vi.fn(),
  releaseUploadQuota: vi.fn(),
}));

vi.mock('@/services/collection.service', () => ({
  verifyUserCollections: vi.fn(),
}));

import { DocumentModel } from '@/models/Document.model';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { PDF_MAX_FILE_SIZE_BYTES } from '@/middleware/upload.middleware';
import { buildOversizedPdf, buildSyntheticPdf } from '@/ai-evaluation/syntheticPdf';
import { createDocumentFromPdf } from '@/services/document.service';
import { consumeUploadQuota, releaseUploadQuota } from '@/services/quota.service';
import { PDF_TEXT_TOO_LARGE_MESSAGE, pdfTooManyPagesMessage } from '@/services/pdfLimits';
import { env } from '@/config/env';

function multerFile(buffer: Buffer, name = 'notes.pdf'): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    stream: undefined as never,
    destination: '',
    filename: name,
    path: '',
  };
}

describe('createDocumentFromPdf launch limits', () => {
  const userId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consumeUploadQuota).mockResolvedValue(undefined);
    vi.mocked(releaseUploadQuota).mockResolvedValue(undefined);
    vi.mocked(DocumentModel.create).mockImplementation(async (input) => {
      const created = {
        _id: new Types.ObjectId(),
        ...input,
        embeddingStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return created as never;
    });
  });

  it('accepts a 1-page PDF and consumes upload quota only after validation', async () => {
    const file = multerFile(buildSyntheticPdf(1, { charsPerPage: 200 }));
    const result = await createDocumentFromPdf(userId, file, {});

    expect(result.extraction.status).toBe('success');
    expect(result.extraction.pageCount).toBe(1);
    expect(consumeUploadQuota).toHaveBeenCalledWith(userId);
    expect(DocumentModel.create).toHaveBeenCalled();
  });

  it('accepts a 50-page PDF under the extracted-text cap', async () => {
    const file = multerFile(buildSyntheticPdf(50, { charsPerPage: 200 }));
    const result = await createDocumentFromPdf(userId, file, {});

    expect(result.extraction.pageCount).toBe(50);
    expect(consumeUploadQuota).toHaveBeenCalledOnce();
    expect(DocumentModel.create).toHaveBeenCalledOnce();
  });

  it('rejects a 51-page PDF without consuming quota', async () => {
    const file = multerFile(buildSyntheticPdf(51, { charsPerPage: 80 }));

    await expect(createDocumentFromPdf(userId, file, {})).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: pdfTooManyPagesMessage(env.PDF_MAX_PAGES),
    });
    expect(consumeUploadQuota).not.toHaveBeenCalled();
    expect(DocumentModel.create).not.toHaveBeenCalled();
  });

  it('rejects under-50-page PDFs whose extracted text exceeds 50k characters', async () => {
    const file = multerFile(buildSyntheticPdf(20, { charsPerPage: 3_000 }));

    await expect(createDocumentFromPdf(userId, file, {})).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: PDF_TEXT_TOO_LARGE_MESSAGE,
    });
    expect(consumeUploadQuota).not.toHaveBeenCalled();
    expect(DocumentModel.create).not.toHaveBeenCalled();
  });

  it('does not consume quota when extraction fails', async () => {
    const file = multerFile(Buffer.from('not-a-pdf'), 'bad.pdf');

    await expect(createDocumentFromPdf(userId, file, {})).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
    expect(consumeUploadQuota).not.toHaveBeenCalled();
  });

  it('rejects at quota and does not create a document', async () => {
    vi.mocked(consumeUploadQuota).mockRejectedValue({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'You have reached your daily upload limit. Please try again tomorrow.',
    });

    const file = multerFile(buildSyntheticPdf(1, { charsPerPage: 80 }));

    await expect(createDocumentFromPdf(userId, file, {})).rejects.toMatchObject({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    });
    expect(DocumentModel.create).not.toHaveBeenCalled();
  });

  it('releases quota if document create fails after a valid PDF', async () => {
    vi.mocked(DocumentModel.create).mockRejectedValue(new Error('mongo down'));
    const file = multerFile(buildSyntheticPdf(1, { charsPerPage: 80 }));

    await expect(createDocumentFromPdf(userId, file, {})).rejects.toThrow('mongo down');
    expect(consumeUploadQuota).toHaveBeenCalledOnce();
    expect(releaseUploadQuota).toHaveBeenCalledWith(userId);
  });

  it('keeps the 10MB multer file-size limit unchanged', () => {
    const oversized = buildOversizedPdf(PDF_MAX_FILE_SIZE_BYTES + 2048);
    expect(oversized.length).toBeGreaterThan(PDF_MAX_FILE_SIZE_BYTES);
    expect(PDF_MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
