import express from 'express';
import { applyCoupon, createCoupon, deleteCoupon, getCouponById, getCouponsByShop, getMyCoupons, updateCoupon, updateCouponStatus } from '../controllers/couponController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('SHOP_OWNER'), createCoupon);
router.get('/my-coupons', protect, authorizeRoles('SHOP_OWNER'), getMyCoupons);
router.post('/validate', applyCoupon);
router.post('/apply', applyCoupon);
router.get('/shop/:shopId', getCouponsByShop);
router.get('/:couponId', protect, authorizeRoles('SHOP_OWNER'), getCouponById);
router.put('/:couponId', protect, authorizeRoles('SHOP_OWNER'), updateCoupon);
router.patch('/:couponId/status', protect, authorizeRoles('SHOP_OWNER'), updateCouponStatus);
router.delete('/:couponId', protect, authorizeRoles('SHOP_OWNER'), deleteCoupon);

export default router;
