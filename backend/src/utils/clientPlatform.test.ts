import { describe, expect, it } from 'vitest';
import type { Request } from 'express';

import {
  isMobileClient,
  isMobileLogoutRequest,
  isMobileRefreshRequest,
} from './clientPlatform';

function mockRequest(
  headers: Record<string, string | string[] | undefined> = {},
  body: Record<string, unknown> = {},
): Request {
  return { headers, body } as Request;
}

describe('isMobileClient', () => {
  it('returns false when no platform header is present', () => {
    expect(isMobileClient(mockRequest())).toBe(false);
  });

  it('returns true for X-Client-Platform: mobile', () => {
    expect(isMobileClient(mockRequest({ 'x-client-platform': 'mobile' }))).toBe(true);
  });

  it('returns true for X-Client-Type: mobile', () => {
    expect(isMobileClient(mockRequest({ 'x-client-type': 'mobile' }))).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isMobileClient(mockRequest({ 'x-client-platform': 'Mobile' }))).toBe(true);
  });

  it('returns false for non-mobile platform values', () => {
    expect(isMobileClient(mockRequest({ 'x-client-platform': 'web' }))).toBe(false);
  });

  it('uses the first value when the header is an array', () => {
    expect(isMobileClient(mockRequest({ 'x-client-platform': ['mobile', 'web'] }))).toBe(true);
  });
});

describe('isMobileRefreshRequest', () => {
  it('returns true when mobile header is set', () => {
    expect(isMobileRefreshRequest(mockRequest({ 'x-client-platform': 'mobile' }))).toBe(true);
  });

  it('returns true when refreshToken is in the body', () => {
    expect(isMobileRefreshRequest(mockRequest({}, { refreshToken: 'token-abc' }))).toBe(true);
  });

  it('returns false for web clients without body refresh token', () => {
    expect(isMobileRefreshRequest(mockRequest())).toBe(false);
  });
});

describe('isMobileLogoutRequest', () => {
  it('returns true when mobile header is set', () => {
    expect(isMobileLogoutRequest(mockRequest({ 'x-client-type': 'mobile' }))).toBe(true);
  });

  it('returns true when refreshToken is in the body', () => {
    expect(isMobileLogoutRequest(mockRequest({}, { refreshToken: 'token-abc' }))).toBe(true);
  });

  it('returns false for web clients without body refresh token', () => {
    expect(isMobileLogoutRequest(mockRequest())).toBe(false);
  });
});
