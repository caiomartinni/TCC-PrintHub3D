import { Router } from 'express';
import {
  getNotifications, getUnreadCount,
  readNotification, readAllNotifications,
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Static routes first (before /:id)
router.get('/',             authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/read-all',   authenticate, readAllNotifications);
router.patch('/:id/read',   authenticate, readNotification);

export default router;
