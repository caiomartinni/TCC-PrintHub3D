import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts, getMyProducts, getFavorites, getProduct,
  createProduct, updateProduct, deleteProduct, toggleFavorite,
} from '../controllers/products.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome do produto é obrigatório').bail()
    .isLength({ min: 3, max: 150 }).withMessage('Nome deve ter entre 3 e 150 caracteres'),

  body('description')
    .trim()
    .notEmpty().withMessage('Descrição é obrigatória').bail()
    .isLength({ min: 10 }).withMessage('Descrição deve ter no mínimo 10 caracteres'),

  body('price')
    .notEmpty().withMessage('Preço é obrigatório').bail()
    .isFloat({ gt: 0 }).withMessage('Preço deve ser um número maior que zero'),

  body('categoryId')
    .notEmpty().withMessage('Categoria é obrigatória').bail()
    .isUUID().withMessage('Categoria inválida'),

  body('material')
    .trim()
    .notEmpty().withMessage('Material é obrigatório'),

  body('stock')
    .optional({ values: 'null' })
    .isInt({ min: 0 }).withMessage('Estoque deve ser um número inteiro maior ou igual a zero'),

  validate,
];

// rotas estáticas devem vir antes de /:slug para evitar conflito
router.get('/',          getProducts);
router.get('/mine',      authenticate, authorize('MAKER', 'ADMIN'), getMyProducts);
router.get('/favorites', authenticate, getFavorites);
router.get('/:slug',     getProduct);

const updateProductValidation = [
  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Preço deve ser um número maior que zero'),
  validate,
];

router.post('/',                authenticate, authorize('MAKER', 'ADMIN'), createProductValidation, createProduct);
router.put('/:id',              authenticate, authorize('MAKER', 'ADMIN'), updateProductValidation, updateProduct);
router.delete('/:id',           authenticate, authorize('MAKER', 'ADMIN'), deleteProduct);
router.post('/:id/favorite',    authenticate, toggleFavorite);

export default router;
