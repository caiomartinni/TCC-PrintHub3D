import { Router } from 'express';
import { getDashboard, getUsers, approveMaker, toggleUser } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/makers/:id/approve', approveMaker);
router.patch('/users/:id/toggle', toggleUser);

export default router;
