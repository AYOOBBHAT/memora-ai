import { OAuth2Client } from 'google-auth-library';
import { User, IUserDocument } from '@/models/User.model';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { env } from '@/config/env';

export interface GoogleTokenPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

function assertGoogleClientIdConfigured(): void {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'Google authentication is not configured. Set GOOGLE_CLIENT_ID in the environment.',
    );
  }
}

/** Audiences accepted when verifying Google ID tokens (Web + optional Android client). */
export function getGoogleIdTokenAudiences(): string[] {
  const audiences = [env.GOOGLE_CLIENT_ID, env.GOOGLE_ANDROID_CLIENT_ID].filter(
    (id): id is string => Boolean(id?.trim()),
  );

  return [...new Set(audiences)];
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  assertGoogleClientIdConfigured();

  const audiences = getGoogleIdTokenAudiences();
  const client = new OAuth2Client(audiences[0]);

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid Google ID token');
    }

    if (!payload.email) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Google account email is required');
    }

    if (payload.email_verified === false) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Google account email is not verified');
    }

    return {
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0],
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired Google ID token');
  }
}

export async function findOrCreateGoogleUser(
  payload: GoogleTokenPayload,
): Promise<{ user: IUserDocument; created: boolean }> {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    if (existingUser.googleSub && existingUser.googleSub !== payload.sub) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Google account does not match existing user',
      );
    }

    let needsSave = false;

    if (!existingUser.googleSub) {
      existingUser.googleSub = payload.sub;
      needsSave = true;
    }

    if (payload.picture && !existingUser.avatar) {
      existingUser.avatar = payload.picture;
      needsSave = true;
    }

    if (needsSave) {
      await existingUser.save();
    }

    return { user: existingUser, created: false };
  }

  const user = await User.create({
    email: payload.email,
    name: payload.name,
    avatar: payload.picture,
    provider: 'google',
    googleSub: payload.sub,
  });

  return { user, created: true };
}
