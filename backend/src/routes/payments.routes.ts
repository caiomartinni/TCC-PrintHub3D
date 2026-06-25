import { Router } from 'express';
import { createPreference, processPayment, getPaymentStatus, handleWebhook } from '../controllers/payments.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/preference',         authenticate, createPreference);
router.post('/process',            authenticate, processPayment);
router.get('/status/:paymentId',   authenticate, getPaymentStatus);
router.post('/webhook',            handleWebhook);  // chamado pelo Mercado Pago — sem autenticação

export default router;
