import express from 'express';
import { createOrder, getMyOrders, getOrdersForOwner, updateOrderStatus } from '../controllers/orderController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('USER'), createOrder);
router.get('/my-orders', protect, authorizeRoles('USER'), getMyOrders);
router.get('/shop-owner', protect, authorizeRoles('SHOP_OWNER'), getOrdersForOwner);
router.put('/:orderId/status', protect, authorizeRoles('SHOP_OWNER'), updateOrderStatus);

export default router;
