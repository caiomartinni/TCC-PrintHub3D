import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categories.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize('ADMIN'), createCategory);

export default router;
