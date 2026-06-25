import { Router } from 'express';
import {
  createQuoteRequest, getQuoteRequests, getOpenQuotes, getMakerQuotes,
  respondToQuote, rejectQuoteRequest, acceptQuoteResponse, updateQuoteFiles,
} from '../controllers/quotes.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// rotas estáticas devem vir antes de /:id para evitar conflito
router.get('/open',   authenticate, authorize('MAKER', 'ADMIN'), getOpenQuotes);
router.get('/maker',  authenticate, authorize('MAKER', 'ADMIN'), getMakerQuotes);
router.get('/',       authenticate, getQuoteRequests);

router.post('/',                     authenticate,                               createQuoteRequest);
router.post('/:id/respond',          authenticate, authorize('MAKER', 'ADMIN'),  respondToQuote);
router.post('/:id/reject',           authenticate, authorize('MAKER', 'ADMIN'),  rejectQuoteRequest);
router.post('/responses/:id/accept', authenticate,                               acceptQuoteResponse);
router.patch('/:id/files',           authenticate, authorize('CLIENT'),           updateQuoteFiles);

export default router;
