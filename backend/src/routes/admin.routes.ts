import { Router } from 'express';
import {
  getDashboard,
  getUsers, toggleUser,
  getMakers, updateMakerStatus, requestKycCorrection,
  getOrders,
  getProducts, toggleProduct,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboard);

// Users
router.get('/users',             getUsers);
router.patch('/users/:id/toggle',toggleUser);

// Makers
router.get('/makers',                   getMakers);
router.patch('/makers/:id/status',      updateMakerStatus);
router.patch('/makers/:id/kyc-correction', requestKycCorrection);

// Orders
router.get('/orders',   getOrders);

// Products (marketplace management)
router.get('/products',               getProducts);
router.patch('/products/:id/toggle',  toggleProduct);

export default router;
