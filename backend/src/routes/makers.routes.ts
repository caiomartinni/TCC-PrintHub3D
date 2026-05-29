import { Router } from 'express';
import { getMakers, getMaker, updateMakerProfile, getMakerDashboard } from '../controllers/makers.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getMakers);
router.get('/dashboard', authenticate, authorize('MAKER'), getMakerDashboard);
router.get('/:id', getMaker);
router.put('/profile', authenticate, authorize('MAKER'), updateMakerProfile);

export default router;
