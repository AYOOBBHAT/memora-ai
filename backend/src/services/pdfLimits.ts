import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';

export function pdfTooManyPagesMessage(maxPages: number = env.PDF_MAX_PAGES): string {
  return `PDF exceeds the maximum supported page limit of ${maxPages} pages.`;
}

export const PDF_TEXT_TOO_LARGE_MESSAGE =
  'PDF contains more text than Memora currently supports. Please use a smaller document.';

/**
 * Launch limits applied after PDF text extraction. File size is enforced earlier
 * by multer (10 MB). Notes, URL, and YouTube imports do not use this helper.
 */
export function assertPdfWithinLaunchLimits(pageCount: number | undefined, text: string): void {
  const pages = pageCount ?? 0;

  if (pages > env.PDF_MAX_PAGES) {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, pdfTooManyPagesMessage());
  }

  if (text.length > env.PDF_MAX_EXTRACTED_CHARS) {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, PDF_TEXT_TOO_LARGE_MESSAGE);
  }
}
