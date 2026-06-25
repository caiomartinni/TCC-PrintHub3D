import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import prisma from '../utils/prisma.js';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    // Always verify account is still active in the DB.
    // This ensures suspended/deactivated users lose access immediately,
    // even if they still have a valid JWT.
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { isActive: true },
    });

    if (!user) {
      errorResponse(res, 'Conta não encontrada', 401);
      return;
    }

    if (!user.isActive) {
      errorResponse(res, 'Conta suspensa ou desativada. Entre em contato com o suporte.', 401);
      return;
    }

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
