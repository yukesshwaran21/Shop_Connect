import express from 'express';
import { createOffer, deleteOffer, getMyOffers, getOffers, getOffersByProduct, updateOffer, updateOfferStatus } from '../controllers/offerController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('SHOP_OWNER'), createOffer);
router.get('/my-offers', protect, authorizeRoles('SHOP_OWNER'), getMyOffers);
router.get('/product/:productId', (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return protect(req, res, () => next());
	}
	return next();
}, getOffersByProduct);
router.get('/', getOffers);
router.put('/:offerId', protect, authorizeRoles('SHOP_OWNER'), updateOffer);
router.patch('/:offerId/status', protect, authorizeRoles('SHOP_OWNER'), updateOfferStatus);
router.delete('/:offerId', protect, authorizeRoles('SHOP_OWNER'), deleteOffer);

export default router;
