import { Router } from 'express';
import {
  createQuoteRequest, getQuoteRequests, getOpenQuotes,
  respondToQuote, acceptQuoteResponse,
} from '../controllers/quotes.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/open', authenticate, authorize('MAKER'), getOpenQuotes);
router.get('/', authenticate, getQuoteRequests);
router.post('/', authenticate, authorize('CLIENT'), createQuoteRequest);
router.post('/:id/respond', authenticate, authorize('MAKER'), respondToQuote);
router.post('/responses/:id/accept', authenticate, authorize('CLIENT'), acceptQuoteResponse);

export default router;
