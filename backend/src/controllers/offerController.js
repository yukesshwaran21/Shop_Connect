import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import { calculateDiscountedPrice, isOfferCurrentlyActive } from '../utils/pricing.js';

const validateOfferInput = ({ discountType, discountValue, startDate, endDate }, product) => {
  if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
    return 'Discount type must be PERCENTAGE or FIXED';
  }

  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    return 'Discount value must be greater than 0';
  }

  if (discountType === 'PERCENTAGE' && value > 100) {
    return 'Percentage discount cannot exceed 100%';
  }

  if (discountType === 'FIXED' && value > product.sellingPrice) {
    return 'Fixed discount cannot exceed the product selling price';
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Start date and end date must be valid dates';
  }
  if (end <= start) {
    return 'End date must be after start date';
  }

  return null;
};

const formatOffer = (offer, product) => ({
  ...offer.toObject(),
  product: product
    ? {
        _id: product._id,
        productName: product.productName,
        image: product.image,
        originalPrice: product.originalPrice,
        sellingPrice: product.sellingPrice,
        brand: product.brand,
      }
    : undefined,
  finalPrice: product ? calculateDiscountedPrice(product.sellingPrice, offer.discountType, offer.discountValue) : null,
  isCurrentlyActive: isOfferCurrentlyActive(offer),
});

export const createOffer = async (req, res) => {
  try {
    const { productId, discountType, discountValue, startDate, endDate, isActive = true } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only manage offers for your own shop' });
    }

    const validationError = validateOfferInput({ discountType, discountValue, startDate, endDate }, product);
    if (validationError) return res.status(400).json({ message: validationError });

    const offer = await Offer.create({
      productId: product._id,
      shopId: shop._id,
      discountType,
      discountValue: Number(discountValue),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
    });

    res.status(201).json(formatOffer(offer, product));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create offer' });
  }
};

export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch offers' });
  }
};

export const getMyOffers = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) return res.json([]);

    const offers = await Offer.find({ shopId: shop._id }).sort({ createdAt: -1 });
    const products = await Product.find({ shopId: shop._id });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    res.json(offers.map((offer) => formatOffer(offer, productMap.get(offer.productId.toString()))));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your offers' });
  }
};

export const getOffersByProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user?.role === 'SHOP_OWNER') {
      const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
      if (!shop) return res.status(403).json({ message: 'You can only access offers for your own products' });
      const offers = await Offer.find({ productId: product._id }).sort({ createdAt: -1 });
      return res.json(offers.map((offer) => formatOffer(offer, product)));
    }

    const offers = await Offer.find({
      productId: product._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).sort({ createdAt: -1 });
    res.json(offers.map((offer) => formatOffer(offer, product)));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch product offers' });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const product = await Product.findById(offer.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only update offers for your own shop' });
    }

    const nextValues = {
      discountType: req.body.discountType ?? offer.discountType,
      discountValue: req.body.discountValue ?? offer.discountValue,
      startDate: req.body.startDate ?? offer.startDate,
      endDate: req.body.endDate ?? offer.endDate,
    };
    if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    const validationError = validateOfferInput(nextValues, product);
    if (validationError) return res.status(400).json({ message: validationError });

    const fields = ['discountType', 'discountValue', 'startDate', 'endDate', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) offer[field] = field === 'discountValue'
        ? Number(req.body[field])
        : field === 'startDate' || field === 'endDate'
          ? new Date(req.body[field])
          : req.body[field];
    });

    await offer.save();
    res.json(formatOffer(offer, product));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update offer' });
  }
};

export const updateOfferStatus = async (req, res) => {
  try {
    if (typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const product = await Product.findById(offer.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) return res.status(403).json({ message: 'You can only change your own offers' });

    offer.isActive = req.body.isActive;
    await offer.save();
    res.json(formatOffer(offer, product));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update offer status' });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const product = await Product.findById(offer.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only delete offers for your own shop' });
    }

    await offer.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete offer' });
  }
};
