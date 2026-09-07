import Coupon from '../models/Coupon.js';
import Shop from '../models/Shop.js';
import { normalizeCouponCode, validateAndCalculateCoupon, validateCouponDefinition } from '../utils/couponService.js';

const ownerShop = (req) => Shop.findOne({ ownerId: req.user._id });
const ownerCoupon = async (req) => {
  const shop = await ownerShop(req);
  return { shop, coupon: shop ? await Coupon.findOne({ _id: req.params.couponId, shopId: shop._id }) : null };
};
const payloadFrom = (body) => ({
  discountType: body.discountType,
  discountValue: Number(body.discountValue),
  minimumPurchase: Number(body.minimumPurchase || 0),
  maximumDiscount: Number(body.maximumDiscount || 0),
  applicableProducts: Array.isArray(body.applicableProducts) ? body.applicableProducts : [],
  applicableBrands: Array.isArray(body.applicableBrands) ? body.applicableBrands : [],
  applicableCategories: Array.isArray(body.applicableCategories) ? body.applicableCategories : [],
  startDate: new Date(body.startDate),
  endDate: new Date(body.endDate),
  usageLimit: Number(body.usageLimit),
  isActive: body.isActive === undefined ? true : body.isActive,
});

export const createCoupon = async (req, res) => {
  try {
    const couponCode = normalizeCouponCode(req.body.couponCode);
    const shop = await ownerShop(req);
    if (!couponCode) return res.status(400).json({ message: 'Coupon code is required' });
    if (!shop) return res.status(400).json({ message: 'Create a shop before creating coupons' });
    const payload = payloadFrom(req.body);
    const validationError = validateCouponDefinition(payload);
    if (validationError) return res.status(400).json({ message: validationError });
    if (typeof payload.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be a boolean' });
    if (await Coupon.exists({ couponCode, shopId: shop._id })) return res.status(409).json({ message: 'Coupon code already exists in this shop' });

    const coupon = await Coupon.create({ ...payload, couponCode, shopId: shop._id, usedCount: 0 });

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Coupon code already exists in this shop' });
    res.status(500).json({ message: error.message || 'Failed to create coupon' });
  }
};

export const getMyCoupons = async (req, res) => {
  try {
    const shop = await ownerShop(req);
    res.json(shop ? await Coupon.find({ shopId: shop._id }).sort({ createdAt: -1 }) : []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupons' });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { coupon } = await ownerCoupon(req);
    if (!coupon) return res.status(403).json({ message: 'You can only access your own coupons' });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupon' });
  }
};

export const getCouponsByShop = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ shopId: req.params.shopId, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupons' });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const result = await validateAndCalculateCoupon({ ...req.body, couponCode: req.body.couponCode || req.body.code });
    if (result.status) return res.status(result.status).json({ message: result.message });
    res.json({ success: true, valid: true, couponCode: result.couponCode, couponId: result.coupon._id, discount: result.discount, subtotal: result.subtotal, finalAmount: result.finalAmount, finalTotal: result.finalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Could not apply coupon' });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { coupon } = await ownerCoupon(req);
    if (!coupon) return res.status(403).json({ message: 'You can only update your own coupons' });
    const payload = payloadFrom({ ...coupon.toObject(), ...req.body });
    const validationError = validateCouponDefinition(payload);
    if (validationError) return res.status(400).json({ message: validationError });
    if (typeof payload.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be a boolean' });
    Object.assign(coupon, payload);
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update coupon' });
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be a boolean' });
    const { coupon } = await ownerCoupon(req);
    if (!coupon) return res.status(403).json({ message: 'You can only change your own coupons' });
    coupon.isActive = req.body.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update coupon status' });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { coupon } = await ownerCoupon(req);
    if (!coupon) return res.status(403).json({ message: 'You can only delete your own coupons' });
    await coupon.deleteOne();
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete coupon' });
  }
};
