import { Router } from 'express';
import {
  getOrCreateChat,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Static routes before /:chatId
router.get('/unread-count',            authenticate, getUnreadCount);
router.post('/orders/:orderId',        authenticate, getOrCreateChat);  // get-or-create
router.get('/orders/:orderId',         authenticate, getOrCreateChat);  // alias for GET

router.get('/:chatId/messages',        authenticate, getMessages);
router.post('/:chatId/messages',       authenticate, sendMessage);
router.patch('/:chatId/read',          authenticate, markMessagesAsRead);

export default router;
