import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from '@/swagger/openapi.json';

const router = Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openapiSpec));

export default router;
