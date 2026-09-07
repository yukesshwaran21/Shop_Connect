import express from 'express';
import { createProduct, deleteProduct, getMyProducts, getProductById, getProductsByShop, updateProduct } from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/shop/:shopId', getProductsByShop);
router.get('/my-products', protect, authorizeRoles('SHOP_OWNER'), getMyProducts);
router.get('/:productId', protect, authorizeRoles('SHOP_OWNER'), getProductById);
router.post('/', protect, authorizeRoles('SHOP_OWNER'), createProduct);
router.put('/:productId', protect, authorizeRoles('SHOP_OWNER'), updateProduct);
router.delete('/:productId', protect, authorizeRoles('SHOP_OWNER'), deleteProduct);

export default router;
