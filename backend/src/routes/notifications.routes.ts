import { Router } from 'express';
import { getNotifications, readNotification, readAllNotifications } from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, readNotification);
router.patch('/read-all', authenticate, readAllNotifications);

export default router;
