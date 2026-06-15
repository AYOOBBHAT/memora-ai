import {
  FormatError,
  PasswordException,
  PDFParse,
} from 'pdf-parse';

export type PdfExtractionStatus = 'success' | 'failed';

export interface PdfExtractionResult {
  status: PdfExtractionStatus;
  text?: string;
  pageCount?: number;
  error?: string;
}

const ENCRYPTED_PDF_MESSAGE = 'PDF is encrypted or password-protected';
const EMPTY_PDF_MESSAGE =
  'No extractable text found in PDF. Only text-based PDFs are supported (no OCR).';
const INVALID_PDF_MESSAGE = 'Unable to read PDF file';

function classifyPdfError(error: unknown): string {
  if (error instanceof PasswordException) {
    return ENCRYPTED_PDF_MESSAGE;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/password|encrypt|decrypt/i.test(message)) {
    return ENCRYPTED_PDF_MESSAGE;
  }

  if (error instanceof FormatError) {
    return INVALID_PDF_MESSAGE;
  }

  return message || INVALID_PDF_MESSAGE;
}

export function stripPdfExtension(fileName: string): string {
  return fileName.replace(/\.pdf$/i, '').trim() || fileName;
}

/**
 * Extracts plain text from a text-based PDF buffer. No OCR — image-only PDFs return failed status.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  let parser: PDFParse | undefined;

  try {
    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const text = textResult.text.trim();
    const pageCount = textResult.total;

    if (!text) {
      return {
        status: 'failed',
        pageCount,
        error: EMPTY_PDF_MESSAGE,
      };
    }

    return {
      status: 'success',
      text,
      pageCount,
    };
  } catch (error) {
    return {
      status: 'failed',
      error: classifyPdfError(error),
    };
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }
}
