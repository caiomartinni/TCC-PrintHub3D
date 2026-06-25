import { Router } from 'express';
import { body } from 'express-validator';
import {
  register, login, refreshToken, me, updateProfile,
  changePassword, deleteAccount, getAddress, saveAddress,
  forgotPassword, validateResetToken, resetPasswordWithToken,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// CPF/CNPJ validados com módulo 11 — campos opcionais pois o controller atual
// não os persiste; validação existe para blindagem caso sejam enviados no futuro
const isValidCPF = (raw: string): boolean => {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += +d[i] * (len + 1 - i);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === +d[9] && calc(10) === +d[10];
};

const isValidCNPJ = (raw: string): boolean => {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) {
      s += +d[len - i] * pos--;
      if (pos < 2) pos = 9;
    }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === +d[12] && calc(13) === +d[13];
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório').bail()
    .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório').bail()
    .isEmail().withMessage('E-mail inválido'),
    // normalizeEmail() omitido — transformaria "jo.ao@gmail.com" em "joao@gmail.com"
    // e quebraria login de usuários já cadastrados com o ponto

  body('password')
    .notEmpty().withMessage('Senha é obrigatória').bail()
    .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres'),

  body('cpf')
    .optional({ values: 'falsy' })
    .custom((value: unknown) => typeof value === 'string' && isValidCPF(value))
    .withMessage('CPF inválido'),

  body('cnpj')
    .optional({ values: 'falsy' })
    .custom((value: unknown) => typeof value === 'string' && isValidCNPJ(value))
    .withMessage('CNPJ inválido'),

  validate,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório').bail()
    .isEmail().withMessage('E-mail inválido'),
    // normalizeEmail() omitido — mesmo motivo do registro (quebraria contas com ponto no Gmail)

  // valida apenas presença — política de tamanho não se aplica no login (contas antigas podem ter senha curta)
  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),

  validate,
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.delete('/account',  authenticate, deleteAccount);
router.get('/address',    authenticate, getAddress);
router.post('/address',   authenticate, saveAddress);

router.post('/forgot-password',             forgotPassword);
router.get('/reset-password/:token',        validateResetToken);
router.post('/reset-password',              resetPasswordWithToken);

export default router;
