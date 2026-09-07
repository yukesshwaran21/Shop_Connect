import express from 'express';
import { createProduct, deleteProduct, getProductsByShop, updateProduct } from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/shop/:shopId', getProductsByShop);
router.post('/', protect, authorizeRoles('SHOP_OWNER'), createProduct);
router.put('/:productId', protect, authorizeRoles('SHOP_OWNER'), updateProduct);
router.delete('/:productId', protect, authorizeRoles('SHOP_OWNER'), deleteProduct);

export default router;
