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

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/users',             getUsers);
router.patch('/users/:id/toggle',toggleUser);
router.get('/makers',                   getMakers);
router.patch('/makers/:id/status',      updateMakerStatus);
router.patch('/makers/:id/kyc-correction', requestKycCorrection);
router.get('/orders',   getOrders);
router.get('/products',               getProducts);
router.patch('/products/:id/toggle',  toggleProduct);

export default router;
