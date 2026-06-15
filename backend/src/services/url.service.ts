import dns from 'node:dns/promises';
import net from 'node:net';

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';

export type UrlExtractionStatus = 'success' | 'failed';

export interface UrlExtractionResult {
  status: UrlExtractionStatus;
  text?: string;
  title?: string;
  originalUrl: string;
  error?: string;
}

const FETCH_TIMEOUT_MS = 25_000;
const USER_AGENT = 'MemoraAI/1.0 (URL import bot; +https://memora.ai)';
const EMPTY_EXTRACTION_MESSAGE = 'No extractable text found on the page';
const NON_HTML_MESSAGE = 'URL did not return HTML content';
const SSRF_BLOCKED_MESSAGE = 'URL points to a private or restricted address';
const UNREACHABLE_MESSAGE = 'Unable to reach URL';
const TIMEOUT_MESSAGE = 'Request timed out while fetching URL';

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;

  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 0) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '::') {
    return true;
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }

  if (normalized.startsWith('fe80')) {
    return true;
  }

  return false;
}

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);

  if (version === 4) {
    return isPrivateIpv4(ip);
  }

  if (version === 6) {
    return isPrivateIpv6(ip);
  }

  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');

  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '0.0.0.0'
  ) {
    return true;
  }

  if (net.isIP(normalized)) {
    return isPrivateIp(normalized);
  }

  return false;
}

export function parsePublicHttpUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Only http and https URLs are supported');
  }

  if (!parsed.hostname) {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Invalid URL');
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, SSRF_BLOCKED_MESSAGE);
  }

  return parsed;
}

export async function assertUrlIsPublic(rawUrl: string): Promise<URL> {
  const parsed = parsePublicHttpUrl(rawUrl);

  if (net.isIP(parsed.hostname)) {
    if (isPrivateIp(parsed.hostname)) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, SSRF_BLOCKED_MESSAGE);
    }

    return parsed;
  }

  let addresses: { address: string; family: number }[];

  try {
    addresses = await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  } catch {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, UNREACHABLE_MESSAGE);
  }

  if (addresses.length === 0) {
    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, UNREACHABLE_MESSAGE);
  }

  for (const entry of addresses) {
    if (isPrivateIp(entry.address)) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, SSRF_BLOCKED_MESSAGE);
    }
  }

  return parsed;
}

function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) {
    return true;
  }

  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return normalized === 'text/html' || normalized === 'application/xhtml+xml';
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFallbackTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = match?.[1]?.replace(/\s+/g, ' ').trim();
  return title || undefined;
}

export function extractArticleFromHtml(html: string, pageUrl: string): UrlExtractionResult {
  const dom = new JSDOM(html, { url: pageUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (article?.textContent?.trim()) {
    return {
      status: 'success',
      text: article.textContent.trim(),
      title: article.title?.trim() || undefined,
      originalUrl: pageUrl,
    };
  }

  const fallbackTitle = extractFallbackTitle(html);
  const fallbackText = stripHtmlToText(dom.window.document.body?.innerHTML ?? html);

  if (fallbackText) {
    return {
      status: 'success',
      text: fallbackText,
      title: fallbackTitle,
      originalUrl: pageUrl,
    };
  }

  return {
    status: 'failed',
    originalUrl: pageUrl,
    error: EMPTY_EXTRACTION_MESSAGE,
  };
}

export async function fetchPageHtml(url: string): Promise<string> {
  const parsed = await assertUrlIsPublic(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.status >= 400) {
      throw new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        `URL returned HTTP ${response.status}`,
      );
    }

    const contentType = response.headers.get('content-type');

    if (!isHtmlContentType(contentType)) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, NON_HTML_MESSAGE);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, TIMEOUT_MESSAGE);
    }

    throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, UNREACHABLE_MESSAGE);
  } finally {
    clearTimeout(timeout);
  }
}

export function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Fetches a public HTML page and extracts readable article text (no auth/cookies).
 */
export async function extractTextFromUrl(rawUrl: string): Promise<UrlExtractionResult> {
  let normalizedUrl = rawUrl.trim();

  try {
    const parsed = await assertUrlIsPublic(normalizedUrl);
    normalizedUrl = parsed.toString();
    const html = await fetchPageHtml(normalizedUrl);
    return extractArticleFromHtml(html, normalizedUrl);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: 'failed',
        originalUrl: normalizedUrl,
        error: error.message,
      };
    }

    return {
      status: 'failed',
      originalUrl: normalizedUrl,
      error: UNREACHABLE_MESSAGE,
    };
  }
}
