import express from 'express';
import { createShop, getMyShops, getShops, getShopById, searchShops, updateShop } from '../controllers/shopController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getShops);
router.get('/my-shops', protect, authorizeRoles('SHOP_OWNER'), getMyShops);
router.get('/search', searchShops);
router.get('/:shopId', getShopById);
router.post('/', protect, authorizeRoles('SHOP_OWNER'), createShop);
router.put('/:shopId', protect, authorizeRoles('SHOP_OWNER'), updateShop);

export default router;
