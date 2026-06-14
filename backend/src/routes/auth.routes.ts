import { NextFunction, Request, Response, Router } from 'express';
import {
  registerUser,
  loginUser,
  googleAuthHandler,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
} from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenBodySchema,
  logoutBodySchema,
} from '@/validators/auth.validator';
import { authenticate, authenticateOptional } from '@/middleware/auth.middleware';
import { isMobileRefreshRequest, isMobileLogoutRequest } from '@/utils/clientPlatform';

const router = Router();

function validateWhenMobileRefresh(req: Request, res: Response, next: NextFunction): void {
  if (isMobileRefreshRequest(req)) {
    validate(refreshTokenBodySchema)(req, res, next);
    return;
  }
  next();
}

function validateWhenMobileLogout(req: Request, res: Response, next: NextFunction): void {
  if (isMobileLogoutRequest(req)) {
    validate(logoutBodySchema)(req, res, next);
    return;
  }
  next();
}

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/google', validate(googleAuthSchema), googleAuthHandler);
router.post('/refresh', validateWhenMobileRefresh, refreshAccessToken);
router.post('/logout', authenticateOptional, validateWhenMobileLogout, logoutUser);
router.get('/me', authenticate, getCurrentUser);

export default router;
