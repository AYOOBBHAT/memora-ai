import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/utils/ApiError';
import {
  assertUrlIsPublic,
  extractArticleFromHtml,
  extractTextFromUrl,
  parsePublicHttpUrl,
} from '@/services/url.service';

const mockLookup = vi.fn();

vi.mock('node:dns/promises', () => ({
  default: {
    lookup: (...args: unknown[]) => mockLookup(...args),
  },
}));

const mockParse = vi.fn();

vi.mock('@mozilla/readability', () => ({
  Readability: vi.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
}));

describe('parsePublicHttpUrl', () => {
  it('accepts https URLs', () => {
    const parsed = parsePublicHttpUrl('https://example.com/article');
    expect(parsed.hostname).toBe('example.com');
  });

  it('rejects file protocol', () => {
    expect(() => parsePublicHttpUrl('file:///etc/passwd')).toThrow(ApiError);
  });

  it('rejects localhost hostname', () => {
    expect(() => parsePublicHttpUrl('http://localhost/page')).toThrow(ApiError);
  });

  it('rejects private IPv4 literals', () => {
    expect(() => parsePublicHttpUrl('http://127.0.0.1/page')).toThrow(ApiError);
    expect(() => parsePublicHttpUrl('http://192.168.1.1/page')).toThrow(ApiError);
  });
});

describe('assertUrlIsPublic', () => {
  beforeEach(() => {
    mockLookup.mockReset();
  });

  it('allows public hostnames that resolve to public IPs', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    const parsed = await assertUrlIsPublic('https://example.com/page');

    expect(parsed.hostname).toBe('example.com');
    expect(mockLookup).toHaveBeenCalledWith('example.com', { all: true, verbatim: true });
  });

  it('rejects hostnames that resolve to private IPs', async () => {
    mockLookup.mockResolvedValue([{ address: '10.0.0.5', family: 4 }]);

    await expect(assertUrlIsPublic('https://evil.example/page')).rejects.toThrow(
      /private or restricted/i,
    );
  });
});

describe('extractArticleFromHtml', () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it('returns readability article text and title', () => {
    mockParse.mockReturnValue({
      title: 'Article Title',
      textContent: '  Main article body  ',
    });

    const result = extractArticleFromHtml('<html></html>', 'https://example.com/a');

    expect(result).toEqual({
      status: 'success',
      text: 'Main article body',
      title: 'Article Title',
      originalUrl: 'https://example.com/a',
    });
  });

  it('falls back to title tag and body text when readability fails', () => {
    mockParse.mockReturnValue(null);

    const html = `
      <html>
        <head><title>Fallback Title</title></head>
        <body><p>Visible paragraph text</p></body>
      </html>
    `;

    const result = extractArticleFromHtml(html, 'https://example.com/b');

    expect(result.status).toBe('success');
    expect(result.title).toBe('Fallback Title');
    expect(result.text).toContain('Visible paragraph text');
  });

  it('returns failed when no text can be extracted', () => {
    mockParse.mockReturnValue(null);

    const result = extractArticleFromHtml('<html><body></body></html>', 'https://example.com/c');

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/No extractable text/i);
  });
});

describe('extractTextFromUrl', () => {
  beforeEach(() => {
    mockLookup.mockReset();
    mockParse.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetches HTML and extracts article text', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    mockParse.mockReturnValue({
      title: 'Remote Title',
      textContent: 'Remote article content',
    });

    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'text/html; charset=utf-8' : null),
      },
      text: async () => '<html><body><p>Hello</p></body></html>',
    } as Response);

    const result = await extractTextFromUrl('https://example.com/post');

    expect(result).toEqual({
      status: 'success',
      text: 'Remote article content',
      title: 'Remote Title',
      originalUrl: 'https://example.com/post',
    });
  });

  it('returns failed when fetch returns non-HTML', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      headers: {
        get: () => 'application/json',
      },
      text: async () => '{"ok":true}',
    } as Response);

    const result = await extractTextFromUrl('https://example.com/data.json');

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/HTML/i);
  });

  it('returns failed when fetch returns HTTP error', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);

    vi.mocked(fetch).mockResolvedValue({
      status: 404,
      headers: {
        get: () => 'text/html',
      },
      text: async () => '<html></html>',
    } as Response);

    const result = await extractTextFromUrl('https://example.com/missing');

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/HTTP 404/i);
  });
});
