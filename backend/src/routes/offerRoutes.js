import express from 'express';
import { createOffer, deleteOffer, getOffers, updateOffer } from '../controllers/offerController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('SHOP_OWNER'), createOffer);
router.get('/', getOffers);
router.put('/:offerId', protect, authorizeRoles('SHOP_OWNER'), updateOffer);
router.delete('/:offerId', protect, authorizeRoles('SHOP_OWNER'), deleteOffer);

export default router;
