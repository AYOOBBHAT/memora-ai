import { describe, expect, it } from 'vitest';

import { importUrlSchema, uploadPdfFieldsSchema } from '@/validators/document.validator';

describe('uploadPdfFieldsSchema', () => {
  it('accepts an empty body', () => {
    const result = uploadPdfFieldsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts optional title and collectionId', () => {
    const result = uploadPdfFieldsSchema.safeParse({
      title: '  My PDF  ',
      collectionId: '507f1f77bcf86cd799439011',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My PDF');
    }
  });

  it('rejects invalid collectionId', () => {
    const result = uploadPdfFieldsSchema.safeParse({
      collectionId: 'not-an-object-id',
    });

    expect(result.success).toBe(false);
  });

  it('rejects title longer than 500 characters', () => {
    const result = uploadPdfFieldsSchema.safeParse({
      title: 'a'.repeat(501),
    });

    expect(result.success).toBe(false);
  });
});

describe('importUrlSchema', () => {
  it('accepts a valid https URL', () => {
    const result = importUrlSchema.safeParse({
      url: 'https://example.com/article',
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-http protocols', () => {
    const result = importUrlSchema.safeParse({
      url: 'file:///tmp/page.html',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid URLs', () => {
    const result = importUrlSchema.safeParse({
      url: 'not-a-url',
    });

    expect(result.success).toBe(false);
  });

  it('accepts optional title and collectionId', () => {
    const result = importUrlSchema.safeParse({
      url: 'https://news.example.com/story',
      title: '  Custom title  ',
      collectionId: '507f1f77bcf86cd799439011',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Custom title');
    }
  });
});
