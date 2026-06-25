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

// rotas estáticas devem vir antes de /:chatId para evitar conflito
router.get('/unread-count',            authenticate, getUnreadCount);
router.post('/orders/:orderId',        authenticate, getOrCreateChat);
router.get('/orders/:orderId',         authenticate, getOrCreateChat);

router.get('/:chatId/messages',        authenticate, getMessages);
router.post('/:chatId/messages',       authenticate, sendMessage);
router.patch('/:chatId/read',          authenticate, markMessagesAsRead);

export default router;
