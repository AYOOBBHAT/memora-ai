import { AuthenticatedUser } from '@/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      file?: Express.Multer.File;
    }
  }
}

export {};