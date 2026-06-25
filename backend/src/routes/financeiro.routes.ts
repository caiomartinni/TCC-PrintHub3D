import { Router } from 'express';
import { getResumo, getSaques } from '../controllers/financeiro.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/resumo', authenticate, authorize('MAKER'), getResumo);
router.get('/saques', authenticate, authorize('MAKER'), getSaques);

export default router;
