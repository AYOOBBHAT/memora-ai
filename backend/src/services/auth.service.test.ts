import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/models/User.model', () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('@/models/RefreshToken.model', () => ({
  RefreshToken: {
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
  hashToken: vi.fn((token: string) => `hashed-${token}`),
}));

vi.mock('@/services/token.service', () => ({
  signAccessToken: vi.fn(() => 'mock-access-token'),
  signRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn(() => ({
    sub: 'user-id-1',
    email: 'user@example.com',
    role: 'user',
  })),
  getRefreshTokenExpiry: vi.fn(() => new Date('2030-01-01T00:00:00.000Z')),
}));

import { User } from '@/models/User.model';
import { RefreshToken } from '@/models/RefreshToken.model';
import { login, register, refreshTokens } from '@/services/auth.service';

const mockUser = {
  _id: { toString: () => 'user-id-1' },
  email: 'user@example.com',
  name: 'Test User',
  provider: 'local',
  subscription: 'free',
  role: 'user',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  comparePassword: vi.fn().mockResolvedValue(true),
};

describe('auth.service token responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register returns access and refresh tokens for mobile-capable clients', async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.create).mockResolvedValue(mockUser as never);
    vi.mocked(RefreshToken.create).mockResolvedValue({} as never);

    const result = await register('user@example.com', 'password123', 'Test User');

    expect(result.tokens.accessToken).toBe('mock-access-token');
    expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    expect(RefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'hashed-mock-refresh-token',
        userId: mockUser._id,
      }),
    );
  });

  it('login returns access and refresh tokens for mobile-capable clients', async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    } as never);
    vi.mocked(RefreshToken.create).mockResolvedValue({} as never);

    const result = await login('user@example.com', 'password123');

    expect(result.tokens.accessToken).toBe('mock-access-token');
    expect(result.tokens.refreshToken).toBe('mock-refresh-token');
  });

  it('refreshTokens rotates tokens and returns a new refresh token', async () => {
    const storedToken = {
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null,
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(RefreshToken.findOne).mockResolvedValue(storedToken as never);
    vi.mocked(User.findById).mockResolvedValue(mockUser as never);
    vi.mocked(RefreshToken.create).mockResolvedValue({} as never);

    const result = await refreshTokens('existing-refresh-token');

    expect(storedToken.revokedAt).toBeInstanceOf(Date);
    expect(storedToken.save).toHaveBeenCalled();
    expect(result.tokens.accessToken).toBe('mock-access-token');
    expect(result.tokens.refreshToken).toBe('mock-refresh-token');
    expect(RefreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'hashed-mock-refresh-token',
      }),
    );
  });
});
