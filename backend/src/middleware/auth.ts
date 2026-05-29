import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    errorResponse(res, 'Token de autenticação necessário', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    errorResponse(res, 'Token inválido', 401);
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    errorResponse(res, 'Token inválido ou expirado', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Não autenticado', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      errorResponse(res, 'Acesso não autorizado', 403);
      return;
    }
    next();
  };
};
