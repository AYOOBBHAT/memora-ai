import { Request, Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  isMobileClient,
  isMobileRefreshRequest,
  isMobileLogoutRequest,
} from '@/utils/clientPlatform';
import {
  register,
  login,
  refreshTokens,
  logout,
  getUserById,
  googleSignIn,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  REFRESH_COOKIE_NAME,
} from '@/services/auth.service';
import { AuthTokens, MobileAuthData, SafeUser } from '@/types';

function mobileAuthData(user: SafeUser, tokens: AuthTokens): MobileAuthData {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user,
  };
}

function webAuthData(user: SafeUser, tokens: AuthTokens) {
  return {
    user,
    accessToken: tokens.accessToken,
  };
}

function sendAuthResponse(
  res: Response,
  message: string,
  user: SafeUser,
  tokens: AuthTokens,
  mobile: boolean,
  created = false,
): void {
  if (mobile) {
    const data = mobileAuthData(user, tokens);
    if (created) {
      ApiResponse.created(res, message, data);
    } else {
      ApiResponse.success(res, message, data);
    }
    return;
  }

  setRefreshTokenCookie(res, tokens.refreshToken);
  const data = webAuthData(user, tokens);
  if (created) {
    ApiResponse.created(res, message, data);
  } else {
    ApiResponse.success(res, message, data);
  }
}

function sendGoogleAuthResponse(
  res: Response,
  message: string,
  user: SafeUser,
  tokens: AuthTokens,
  mobile: boolean,
  created = false,
): void {
  if (!mobile) {
    setRefreshTokenCookie(res, tokens.refreshToken);
  }

  const data = mobileAuthData(user, tokens);
  if (created) {
    ApiResponse.created(res, message, data);
  } else {
    ApiResponse.success(res, message, data);
  }
}

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const { user, tokens } = await register(email, password, name);

  sendAuthResponse(res, 'User registered successfully', user, tokens, isMobileClient(req), true);
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await login(email, password);

  sendAuthResponse(res, 'Login successful', user, tokens, isMobileClient(req));
});

export const googleAuthHandler = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const { user, tokens, created } = await googleSignIn(idToken);

  sendGoogleAuthResponse(
    res,
    created ? 'Account created successfully' : 'Login successful',
    user,
    tokens,
    isMobileClient(req),
    created,
  );
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const mobile = isMobileRefreshRequest(req);

  const refreshToken = mobile
    ? (req.body.refreshToken as string)
    : (req.cookies[REFRESH_COOKIE_NAME] as string | undefined);

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token required');
  }

  const { user, tokens } = await refreshTokens(refreshToken);

  if (mobile) {
    ApiResponse.success(res, 'Token refreshed successfully', mobileAuthData(user, tokens));
    return;
  }

  setRefreshTokenCookie(res, tokens.refreshToken);
  ApiResponse.success(res, 'Token refreshed successfully', webAuthData(user, tokens));
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (isMobileLogoutRequest(req)) {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (refreshToken) {
      await logout(refreshToken);
    }

    ApiResponse.success(res, 'Logged out successfully');
    return;
  }

  const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

  await logout(refreshToken);
  clearRefreshTokenCookie(res);

  ApiResponse.success(res, 'Logged out successfully');
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);

  ApiResponse.success(res, 'User profile retrieved', { user });
});
