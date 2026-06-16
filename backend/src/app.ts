import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';
import { createCorsMiddlewareOptions } from '@/config/cors';
import { env } from '@/config/env';
import routes from '@/routes';
import swaggerRoutes from '@/routes/swagger.routes';
import { notFoundHandler } from '@/middleware/notFound.middleware';
import { errorHandler } from '@/middleware/error.middleware';

const logger = pino({ name: 'http' });

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors(createCorsMiddlewareOptions(env.CORS_ORIGINS)));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
    },
  });

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
    },
  });

  app.use(globalLimiter);
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1/docs', swaggerRoutes);
  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
