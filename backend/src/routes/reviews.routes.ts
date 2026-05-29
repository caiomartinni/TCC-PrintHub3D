import { Router } from 'express';
import { createReview } from '../controllers/reviews.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('CLIENT'), createReview);

export default router;
