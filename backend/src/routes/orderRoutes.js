import express from 'express';
import { createOrder, getMyOrderById, getMyOrders, getOrdersForOwner, submitPaymentConfirmation, updateOrderStatus, updatePaymentStatus } from '../controllers/orderController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('USER'), createOrder);
router.get('/my-orders', protect, authorizeRoles('USER'), getMyOrders);
router.get('/shop-owner', protect, authorizeRoles('SHOP_OWNER'), getOrdersForOwner);
router.get('/:orderId', protect, authorizeRoles('USER', 'SHOP_OWNER'), getMyOrderById);
router.patch('/:orderId/status', protect, authorizeRoles('SHOP_OWNER'), updateOrderStatus);
router.put('/:orderId/status', protect, authorizeRoles('SHOP_OWNER'), updateOrderStatus);
router.patch('/:orderId/payment-confirmation', protect, authorizeRoles('USER'), submitPaymentConfirmation);
router.patch('/:orderId/payment-status', protect, authorizeRoles('SHOP_OWNER'), updatePaymentStatus);

export default router;
