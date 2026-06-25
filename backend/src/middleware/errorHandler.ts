import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err, 'Erro não tratado');
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    errors: process.env['NODE_ENV'] === 'development' ? err.stack : null,
  });
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
};
