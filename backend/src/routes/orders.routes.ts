import { Router } from 'express';
import { getOrders, getOrder, createOrder, updateOrderStatus } from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrder);
router.post('/', authenticate, createOrder);
router.patch('/:id/status', authenticate, updateOrderStatus);

export default router;
