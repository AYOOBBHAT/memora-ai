import { Response } from 'express';
import { User, IUserDocument } from '@/models/User.model';
import { RefreshToken, hashToken } from '@/models/RefreshToken.model';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '@/services/token.service';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { AuthTokens, SafeUser } from '@/types';
import { env } from '@/config/env';
import {
  verifyGoogleIdToken,
  findOrCreateGoogleUser,
} from '@/services/googleAuth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

export function toSafeUser(user: IUserDocument): SafeUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    subscription: user.subscription,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function generateTokens(user: IUserDocument): Promise<AuthTokens> {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    token: hashToken(refreshToken),
    userId: user._id,
    expiresAt: getRefreshTokenExpiry(),
  });

  return { accessToken, refreshToken };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Email already registered');
  }

  const user = await User.create({ email, password, name, provider: 'local' });
  const tokens = await generateTokens(user);

  return { user: toSafeUser(user), tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
  }

  const tokens = await generateTokens(user);

  return { user: toSafeUser(user), tokens };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token');
  }

  const hashedToken = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({
    token: hashedToken,
    userId: payload.sub,
    revokedAt: null,
  });

  if (!storedToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token not found or revoked');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token expired');
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found');
  }

  const tokens = await generateTokens(user);

  return { user: toSafeUser(user), tokens };
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) {
    return;
  }

  const hashedToken = hashToken(refreshToken);
  await RefreshToken.findOneAndUpdate(
    { token: hashedToken, revokedAt: null },
    { revokedAt: new Date() },
  );
}

export async function getUserById(userId: string): Promise<SafeUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
  }

  return toSafeUser(user);
}

export async function googleSignIn(
  idToken: string,
): Promise<{ user: SafeUser; tokens: AuthTokens; created: boolean }> {
  const payload = await verifyGoogleIdToken(idToken);
  const { user, created } = await findOrCreateGoogleUser(payload);
  const tokens = await generateTokens(user);

  return { user: toSafeUser(user), tokens, created };
}

export { REFRESH_COOKIE_NAME };
