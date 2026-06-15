import { describe, expect, it, vi, beforeEach } from 'vitest';

import {
  buildYouTubeWatchUrl,
  extractYouTubeTranscript,
  isYouTubeUrl,
  parseYouTubeVideoId,
} from '@/services/youtube.service';

vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn(),
  },
}));

import { YoutubeTranscript } from 'youtube-transcript';

const mockedFetchTranscript = vi.mocked(YoutubeTranscript.fetchTranscript);

describe('parseYouTubeVideoId', () => {
  it('parses youtube.com watch URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('parses youtu.be URLs', () => {
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URLs', () => {
    expect(parseYouTubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});

describe('isYouTubeUrl', () => {
  it('returns true for supported YouTube URLs', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });
});

describe('extractYouTubeTranscript', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedFetchTranscript.mockReset();
  });

  it('returns transcript and metadata on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Sample Video',
          author_name: 'Sample Channel',
          thumbnail_url: 'https://img.example/thumb.jpg',
        }),
      }),
    );

    mockedFetchTranscript.mockResolvedValue([
      { text: 'Hello', duration: 1, offset: 0 },
      { text: 'world', duration: 1, offset: 1 },
    ]);

    const result = await extractYouTubeTranscript('https://youtu.be/dQw4w9WgXcQ');

    expect(result.status).toBe('success');
    expect(result.text).toBe('Hello\nworld');
    expect(result.metadata).toMatchObject({
      videoId: 'dQw4w9WgXcQ',
      title: 'Sample Video',
      channel: 'Sample Channel',
      originalUrl: buildYouTubeWatchUrl('dQw4w9WgXcQ'),
    });
  });

  it('returns no transcript error when captions are unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ title: 'Sample Video', author_name: 'Channel' }),
      }),
    );

    mockedFetchTranscript.mockRejectedValue(new Error('Transcript is disabled on this video'));

    const result = await extractYouTubeTranscript('https://youtu.be/dQw4w9WgXcQ');

    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/No transcript/i);
  });
});
