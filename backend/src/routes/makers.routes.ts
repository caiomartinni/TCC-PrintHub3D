import { Router } from 'express';
import { getMakers, getMaker, updateMakerProfile, getMakerDashboard, getMakerReviews } from '../controllers/makers.controller.js';
import { requestWithdrawal, getWithdrawals } from '../controllers/withdrawals.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getMakers);
router.get('/dashboard',   authenticate, authorize('MAKER'), getMakerDashboard);
router.get('/reviews',     authenticate, authorize('MAKER'), getMakerReviews);
router.get('/withdrawals', authenticate, authorize('MAKER'), getWithdrawals);
router.post('/withdraw',   authenticate, authorize('MAKER'), requestWithdrawal);
router.get('/:id', getMaker);
router.put('/profile', authenticate, authorize('MAKER'), updateMakerProfile);

export default router;
