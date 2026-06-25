import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// ─────────────────────────────────────────────────────────────────────────────
// Middleware genérico de checagem de validação (express-validator).
//
// Uso: encadear como ÚLTIMO item de uma lista de validações, logo antes do
// controller — ex.: router.post('/registro', [body('email').isEmail(), ...,
// validate], registerController).
//
// Ele apenas lê o resultado acumulado pelas cadeias `body(...)` que rodaram
// antes dele na mesma rota. Se alguma falhou, responde 400 com a lista de
// erros (no mesmo formato `{ success, message, errors }` já usado em toda a
// API via errorResponse) e interrompe a requisição — o controller nunca chega
// a ser chamado. Se está tudo certo, apenas chama next().
// ─────────────────────────────────────────────────────────────────────────────
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errorResponse(res, 'Dados inválidos. Verifique os campos destacados e tente novamente.', 400, errors.array());
    return;
  }

  next();
};
