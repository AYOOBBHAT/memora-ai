import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockVerifyIdToken = vi.fn();

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

vi.mock('@/config/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    GOOGLE_ANDROID_CLIENT_ID: 'test-android-client-id.apps.googleusercontent.com',
  },
}));

vi.mock('@/models/User.model', () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import { User } from '@/models/User.model';
import {
  verifyGoogleIdToken,
  findOrCreateGoogleUser,
  getGoogleIdTokenAudiences,
} from '@/services/googleAuth.service';
import { HTTP_STATUS } from '@/constants/httpStatus';

const googlePayload = {
  email: 'user@example.com',
  name: 'Google User',
  picture: 'https://example.com/avatar.png',
  sub: 'google-sub-123',
};

function mockGoogleTicket(payload: Record<string, unknown>) {
  mockVerifyIdToken.mockResolvedValue({
    getPayload: () => payload,
  });
}

describe('getGoogleIdTokenAudiences', () => {
  it('includes Web and Android client IDs when both are configured', () => {
    expect(getGoogleIdTokenAudiences()).toEqual([
      'test-client-id.apps.googleusercontent.com',
      'test-android-client-id.apps.googleusercontent.com',
    ]);
  });
});

describe('verifyGoogleIdToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns normalized payload for a valid token', async () => {
    mockGoogleTicket({
      email: 'User@Example.com',
      name: 'Google User',
      picture: 'https://example.com/avatar.png',
      sub: 'google-sub-123',
      email_verified: true,
    });

    const result = await verifyGoogleIdToken('valid-id-token');

    expect(result).toEqual(googlePayload);
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'valid-id-token',
      audience: [
        'test-client-id.apps.googleusercontent.com',
        'test-android-client-id.apps.googleusercontent.com',
      ],
    });
  });

  it('rejects unverified email', async () => {
    mockGoogleTicket({
      email: 'user@example.com',
      email_verified: false,
      sub: 'google-sub-123',
    });

    await expect(verifyGoogleIdToken('bad-token')).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Google account email is not verified',
    });
  });

  it('rejects invalid or expired tokens', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

    await expect(verifyGoogleIdToken('expired-token')).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid or expired Google ID token',
    });
  });
});

describe('findOrCreateGoogleUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new Google user when email does not exist', async () => {
    const createdUser = {
      _id: { toString: () => 'new-user-id' },
      email: googlePayload.email,
      name: googlePayload.name,
      avatar: googlePayload.picture,
      provider: 'google',
    };

    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue(createdUser as never);

    const result = await findOrCreateGoogleUser(googlePayload);

    expect(User.create).toHaveBeenCalledWith({
      email: googlePayload.email,
      name: googlePayload.name,
      avatar: googlePayload.picture,
      provider: 'google',
      googleSub: googlePayload.sub,
    });
    expect(result.created).toBe(true);
    expect(result.user).toBe(createdUser);
  });

  it('logs in an existing user with matching googleSub', async () => {
    const existingUser = {
      _id: { toString: () => 'existing-user-id' },
      email: googlePayload.email,
      name: 'Google User',
      provider: 'google',
      googleSub: googlePayload.sub,
      avatar: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findOne).mockResolvedValue(existingUser as never);

    const result = await findOrCreateGoogleUser(googlePayload);

    expect(User.create).not.toHaveBeenCalled();
    expect(existingUser.save).toHaveBeenCalled();
    expect(existingUser.avatar).toBe(googlePayload.picture);
    expect(result.created).toBe(false);
    expect(result.user).toBe(existingUser);
  });

  it('links googleSub on first Google login for a local user', async () => {
    const existingUser = {
      _id: { toString: () => 'existing-user-id' },
      email: googlePayload.email,
      name: 'Local User',
      provider: 'local',
      googleSub: undefined,
      avatar: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findOne).mockResolvedValue(existingUser as never);

    const result = await findOrCreateGoogleUser(googlePayload);

    expect(User.create).not.toHaveBeenCalled();
    expect(existingUser.googleSub).toBe(googlePayload.sub);
    expect(existingUser.save).toHaveBeenCalled();
    expect(existingUser.avatar).toBe(googlePayload.picture);
    expect(result.created).toBe(false);
    expect(result.user).toBe(existingUser);
  });

  it('rejects Google login when googleSub does not match existing user', async () => {
    const existingUser = {
      _id: { toString: () => 'existing-user-id' },
      email: googlePayload.email,
      name: 'Google User',
      provider: 'google',
      googleSub: 'different-google-sub',
      avatar: 'https://example.com/avatar.png',
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(User.findOne).mockResolvedValue(existingUser as never);

    await expect(findOrCreateGoogleUser(googlePayload)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.FORBIDDEN,
      message: 'Google account does not match existing user',
    });

    expect(User.create).not.toHaveBeenCalled();
    expect(existingUser.save).not.toHaveBeenCalled();
  });
});

describe('verifyGoogleIdToken without GOOGLE_CLIENT_ID', () => {
  it('returns 503 when Google auth is not configured', async () => {
    const { env } = await import('@/config/env');
    const originalClientId = env.GOOGLE_CLIENT_ID;
    env.GOOGLE_CLIENT_ID = undefined;

    await expect(verifyGoogleIdToken('any-token')).rejects.toMatchObject({
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: 'Google authentication is not configured. Set GOOGLE_CLIENT_ID in the environment.',
    });

    env.GOOGLE_CLIENT_ID = originalClientId;
  });
});
