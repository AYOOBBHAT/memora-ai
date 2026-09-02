import { describe, expect, it } from 'vitest';

import { HTTP_STATUS } from '@/constants/httpStatus';
import { PDF_MAX_FILE_SIZE_BYTES } from '@/middleware/upload.middleware';
import {
  PDF_TEXT_TOO_LARGE_MESSAGE,
  assertPdfWithinLaunchLimits,
  pdfTooManyPagesMessage,
} from '@/services/pdfLimits';
import { env } from '@/config/env';

describe('assertPdfWithinLaunchLimits', () => {
  it('accepts a 1-page PDF under the text cap', () => {
    expect(() => assertPdfWithinLaunchLimits(1, 'Hello PDF')).not.toThrow();
  });

  it('accepts a 50-page PDF under the text cap', () => {
    expect(() => assertPdfWithinLaunchLimits(50, 'x'.repeat(40_000))).not.toThrow();
  });

  it('rejects a 51-page PDF', () => {
    try {
      assertPdfWithinLaunchLimits(51, 'short');
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: pdfTooManyPagesMessage(env.PDF_MAX_PAGES),
      });
    }
  });

  it('rejects under 50 pages when extracted text exceeds 50k characters', () => {
    try {
      assertPdfWithinLaunchLimits(10, 'x'.repeat(50_001));
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message: PDF_TEXT_TOO_LARGE_MESSAGE,
      });
    }
  });

  it('does not change the 10MB upload file-size constant', () => {
    expect(PDF_MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});
