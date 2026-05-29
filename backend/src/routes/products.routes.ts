import { Router } from 'express';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleFavorite } from '../controllers/products.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/:slug', getProduct);
router.post('/', authenticate, authorize('MAKER', 'ADMIN'), createProduct);
router.put('/:id', authenticate, authorize('MAKER', 'ADMIN'), updateProduct);
router.delete('/:id', authenticate, authorize('MAKER', 'ADMIN'), deleteProduct);
router.post('/:id/favorite', authenticate, toggleFavorite);

export default router;
