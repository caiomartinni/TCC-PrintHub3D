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

// ─────────────────────────────────────────────────────────────────────────────
// CPF/CNPJ — mesmo algoritmo de dígito verificador (módulo 11) já usado em
// frontend/src/pages/auth/Register.tsx (funções isValidCPF/isValidCNPJ).
//
// Por que `optional`: o controller `register` (auth.controller.ts) só lê
// `{ email, password, name, phone, role }` do body — `cpf`/`cnpj` NÃO fazem
// parte do contrato atual desse endpoint (e também não existem em User nem
// em MakerProfile no schema.prisma). O formulário de Register.tsx coleta e
// valida CPF/CNPJ no cliente, mas `authService.register()` não os envia ao
// back-end hoje. Então "no formato correto onde aplicável" se traduz em:
// validar SE vier preenchido — blindagem contra dado malformado caso esses
// campos passem a ser enviados/persistidos no futuro — sem quebrar nem
// tornar obrigatório algo que a rota não processa atualmente.
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

// ── POST /api/auth/register ──────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório').bail()
    .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório').bail()
    .isEmail().withMessage('E-mail inválido'),
    // normalizeEmail() REMOVIDO: transformaria e-mails Gmail com ponto
    // (ex.: jo.ao@gmail.com → joao@gmail.com) ANTES de chegar no controller,
    // causando mismatch com o que está armazenado no banco e quebrando o login
    // de usuários já cadastrados. O isEmail() acima já garante formato válido.

  body('password')
    .notEmpty().withMessage('Senha é obrigatória').bail()
    .isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres'),

  // Opcionais — formato só é checado quando o campo é enviado (ver nota acima).
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

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('E-mail é obrigatório').bail()
    .isEmail().withMessage('E-mail inválido'),
    // normalizeEmail() REMOVIDO — mesmo motivo do register (ver acima).

  // Login não é o lugar de reforçar a política de criação de senha (tamanho
  // mínimo etc.) — uma conta antiga pode ter senha mais curta que a regra
  // atual. Aqui validamos apenas a presença; quem decide se ela está correta
  // é o bcrypt.compare dentro do controller.
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

// Recuperação de senha (rotas públicas)
router.post('/forgot-password',             forgotPassword);
router.get('/reset-password/:token',        validateResetToken);
router.post('/reset-password',              resetPasswordWithToken);

export default router;
