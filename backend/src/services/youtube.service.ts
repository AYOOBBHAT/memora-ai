import { YoutubeTranscript } from 'youtube-transcript';

import { HTTP_STATUS } from '@/constants/httpStatus';
import { ApiError } from '@/utils/ApiError';

export type YouTubeExtractionStatus = 'success' | 'failed';

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  originalUrl: string;
}

export interface YouTubeTranscriptExtractionResult {
  status: YouTubeExtractionStatus;
  text?: string;
  metadata?: YouTubeVideoMetadata;
  error?: string;
}

interface YouTubeOEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

const INVALID_URL_MESSAGE = 'URL must be a valid YouTube link (youtube.com or youtu.be)';
const VIDEO_UNAVAILABLE_MESSAGE = 'Video is unavailable, private, or does not exist';
const NO_TRANSCRIPT_MESSAGE = 'No transcript or captions are available for this video';
const AGE_RESTRICTED_MESSAGE =
  'This video is age-restricted or requires sign-in and cannot be imported';
const EXTRACTION_FAILED_MESSAGE = 'Failed to extract YouTube transcript';

export function isYouTubeUrl(url: string): boolean {
  return parseYouTubeVideoId(url) !== null;
}

export function parseYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return isValidVideoId(videoId) ? videoId : null;
    }

    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const videoId = parsed.searchParams.get('v');
        return isValidVideoId(videoId) ? videoId : null;
      }

      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed' || pathParts[0] === 'shorts' || pathParts[0] === 'live') {
        const videoId = pathParts[1];
        return isValidVideoId(videoId) ? videoId : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isValidVideoId(videoId: string | null | undefined): videoId is string {
  return typeof videoId === 'string' && /^[\w-]{11}$/.test(videoId);
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function classifyYouTubeError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('transcript is disabled') ||
    normalized.includes('no transcript') ||
    normalized.includes('captions') ||
    normalized.includes('subtitles are disabled')
  ) {
    return NO_TRANSCRIPT_MESSAGE;
  }

  if (
    normalized.includes('video unavailable') ||
    normalized.includes('private video') ||
    normalized.includes('not available') ||
    normalized.includes('does not exist') ||
    normalized.includes('404')
  ) {
    return VIDEO_UNAVAILABLE_MESSAGE;
  }

  if (
    normalized.includes('age') ||
    normalized.includes('sign in') ||
    normalized.includes('login') ||
    normalized.includes('members-only') ||
    normalized.includes('restricted')
  ) {
    return AGE_RESTRICTED_MESSAGE;
  }

  return message.trim() || EXTRACTION_FAILED_MESSAGE;
}

async function fetchYouTubeMetadata(originalUrl: string, videoId: string): Promise<YouTubeVideoMetadata> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(originalUrl)}&format=json`;

  try {
    const response = await fetch(oEmbedUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, VIDEO_UNAVAILABLE_MESSAGE);
    }

    const payload = (await response.json()) as YouTubeOEmbedResponse;

    return {
      videoId,
      title: payload.title?.trim() || `YouTube video ${videoId}`,
      channel: payload.author_name?.trim() || 'Unknown channel',
      thumbnail: payload.thumbnail_url?.trim() || buildYouTubeThumbnailUrl(videoId),
      originalUrl: buildYouTubeWatchUrl(videoId),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    return {
      videoId,
      title: `YouTube video ${videoId}`,
      channel: 'Unknown channel',
      thumbnail: buildYouTubeThumbnailUrl(videoId),
      originalUrl: buildYouTubeWatchUrl(videoId),
    };
  }
}

async function fetchTranscriptText(videoId: string): Promise<string> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const text = segments
      .map((segment) => segment.text.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!text) {
      throw new Error(NO_TRANSCRIPT_MESSAGE);
    }

    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : EXTRACTION_FAILED_MESSAGE;
    throw new Error(classifyYouTubeError(message));
  }
}

export async function extractYouTubeTranscript(url: string): Promise<YouTubeTranscriptExtractionResult> {
  const trimmedUrl = url.trim();
  const videoId = parseYouTubeVideoId(trimmedUrl);

  if (!videoId) {
    return {
      status: 'failed',
      error: INVALID_URL_MESSAGE,
    };
  }

  const originalUrl = buildYouTubeWatchUrl(videoId);

  try {
    const metadata = await fetchYouTubeMetadata(trimmedUrl, videoId);
    const text = await fetchTranscriptText(videoId);

    return {
      status: 'success',
      text,
      metadata,
    };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : EXTRACTION_FAILED_MESSAGE;

    return {
      status: 'failed',
      error: classifyYouTubeError(message),
      metadata: {
        videoId,
        title: `YouTube video ${videoId}`,
        channel: 'Unknown channel',
        thumbnail: buildYouTubeThumbnailUrl(videoId),
        originalUrl,
      },
    };
  }
}
