import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// deve ser inserido como último item na cadeia de validações, antes do controller
// responde 400 se qualquer body() falhou, caso contrário chama next()
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errorResponse(res, 'Dados inválidos. Verifique os campos destacados e tente novamente.', 400, errors.array());
    return;
  }

  next();
};
