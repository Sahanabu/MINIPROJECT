import express from 'express';
import departmentsRouter from './departmentRoutes.js';
import assetsRouter from './assetRoutes.js';
import reportsRouter from './reportRoutes.js';
import vendorsRouter from './vendorRoutes.js';

export const apiRouter = express.Router();

apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/assets', assetsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/vendors', vendorsRouter);
