import { describe, expect, it, vi, beforeEach } from 'vitest';

import { extractTextFromPdf, stripPdfExtension } from '@/services/pdf.service';

const mockGetText = vi.fn();
const mockDestroy = vi.fn().mockResolvedValue(undefined);

vi.mock('pdf-parse', () => ({
  PDFParse: vi.fn().mockImplementation(() => ({
    getText: mockGetText,
    destroy: mockDestroy,
  })),
  PasswordException: class PasswordException extends Error {},
  FormatError: class FormatError extends Error {},
}));

describe('stripPdfExtension', () => {
  it('removes .pdf extension case-insensitively', () => {
    expect(stripPdfExtension('notes.PDF')).toBe('notes');
    expect(stripPdfExtension('report.pdf')).toBe('report');
  });

  it('returns original name when stripping leaves empty string', () => {
    expect(stripPdfExtension('.pdf')).toBe('.pdf');
  });
});

describe('extractTextFromPdf', () => {
  beforeEach(() => {
    mockGetText.mockReset();
    mockDestroy.mockClear();
  });

  it('returns success with text and page count', async () => {
    mockGetText.mockResolvedValue({
      text: '  Hello PDF world  ',
      total: 3,
    });

    const result = await extractTextFromPdf(Buffer.from('fake-pdf'));

    expect(result).toEqual({
      status: 'success',
      text: 'Hello PDF world',
      pageCount: 3,
    });
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('returns failed when extracted text is empty', async () => {
    mockGetText.mockResolvedValue({
      text: '   ',
      total: 2,
    });

    const result = await extractTextFromPdf(Buffer.from('fake-pdf'));

    expect(result.status).toBe('failed');
    expect(result.pageCount).toBe(2);
    expect(result.error).toMatch(/No extractable text/i);
  });

  it('returns failed with message when parser throws', async () => {
    mockGetText.mockRejectedValue(new Error('PDF is encrypted'));

    const result = await extractTextFromPdf(Buffer.from('fake-pdf'));

    expect(result).toEqual({
      status: 'failed',
      error: 'PDF is encrypted or password-protected',
    });
  });
});
