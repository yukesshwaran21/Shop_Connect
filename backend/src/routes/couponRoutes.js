import express from 'express';
import { applyCoupon, createCoupon, getCouponsByShop } from '../controllers/couponController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('SHOP_OWNER'), createCoupon);
router.get('/shop/:shopId', getCouponsByShop);
router.post('/apply', applyCoupon);

export default router;
