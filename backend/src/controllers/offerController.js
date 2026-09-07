import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

export const createOffer = async (req, res) => {
  try {
    const { productId, discountType, discountValue, startDate, endDate, isActive } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only manage offers for your own shop' });
    }

    const offer = await Offer.create({
      productId,
      shopId: shop._id,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
    });

    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create offer' });
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch offers' });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const shop = await Shop.findOne({ _id: offer.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only update offers for your own shop' });
    }

    const fields = ['discountType', 'discountValue', 'startDate', 'endDate', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) offer[field] = req.body[field];
    });

    await offer.save();
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update offer' });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const shop = await Shop.findOne({ _id: offer.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only delete offers for your own shop' });
    }

    await offer.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete offer' });
  }
};
