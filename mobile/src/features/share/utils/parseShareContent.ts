import { isValidHttpUrl } from '../../../api/services/documents.service';

const URL_IN_TEXT_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

export interface ShareDocumentMetadata {
  sharedFrom: 'android-share';
  sharedAt: string;
  sourceText?: string;
  originalUrl?: string;
  shareMimeType?: 'text/plain';
  sourceApp?: string;
}

export interface ParsedShareContent {
  mode: 'url' | 'text';
  url?: string;
  text: string;
  title: string;
  metadata: ShareDocumentMetadata;
}

const SOURCE_TEXT_PREVIEW_LENGTH = 200;

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Shared link';
  }
}

function titleFromText(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim())?.trim();
  if (!firstLine) {
    return 'Shared note';
  }
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
}

function extractFirstUrl(text: string): string | undefined {
  const match = text.match(URL_IN_TEXT_PATTERN);
  if (!match?.[0]) {
    return undefined;
  }
  const candidate = match[0].replace(/[.,!?;:]+$/, '');
  return isValidHttpUrl(candidate) ? candidate : undefined;
}

function isPrimarilyUrl(text: string, url: string): boolean {
  const normalizedText = text.trim();
  const normalizedUrl = url.trim();
  if (normalizedText === normalizedUrl) {
    return true;
  }
  const withoutUrl = normalizedText.replace(normalizedUrl, '').trim();
  return withoutUrl.length < 20;
}

function buildMetadata(
  text: string,
  receivedAt: string,
  options?: { originalUrl?: string; sourceApp?: string },
): ShareDocumentMetadata {
  const trimmed = text.trim();
  return {
    sharedFrom: 'android-share',
    sharedAt: receivedAt,
    shareMimeType: 'text/plain',
    ...(trimmed
      ? { sourceText: trimmed.slice(0, SOURCE_TEXT_PREVIEW_LENGTH) }
      : {}),
    ...(options?.originalUrl ? { originalUrl: options.originalUrl } : {}),
    ...(options?.sourceApp ? { sourceApp: options.sourceApp } : {}),
  };
}

export interface ParseShareInput {
  text: string;
  webUrl?: string | null;
  metaTitle?: string | null;
  receivedAt: string;
  sourceApp?: string;
}

export function parseShareContent(input: ParseShareInput): ParsedShareContent {
  const text = input.text.trim();
  const webUrl = input.webUrl?.trim();
  const receivedAt = input.receivedAt;
  const sourceApp = input.sourceApp;

  if (webUrl && isValidHttpUrl(webUrl) && (!text || isPrimarilyUrl(text, webUrl))) {
    return {
      mode: 'url',
      url: webUrl,
      text: text || webUrl,
      title: input.metaTitle?.trim() || titleFromUrl(webUrl),
      metadata: buildMetadata(text || webUrl, receivedAt, {
        originalUrl: webUrl,
        sourceApp,
      }),
    };
  }

  if (isValidHttpUrl(text)) {
    return {
      mode: 'url',
      url: text,
      text,
      title: input.metaTitle?.trim() || titleFromUrl(text),
      metadata: buildMetadata(text, receivedAt, {
        originalUrl: text,
        sourceApp,
      }),
    };
  }

  const detectedUrl = extractFirstUrl(text);

  return {
    mode: 'text',
    text,
    url: detectedUrl,
    title: input.metaTitle?.trim() || titleFromText(text),
    metadata: buildMetadata(text, receivedAt, {
      originalUrl: detectedUrl,
      sourceApp,
    }),
  };
}
