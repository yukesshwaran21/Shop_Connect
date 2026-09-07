import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import Offer from '../models/Offer.js';
import { calculateDiscountedPrice, isOfferCurrentlyActive } from './pricing.js';

const normalizeList = (value) => {
  if (value === undefined || value === null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item).trim()).filter(Boolean);
};

const matchesRestriction = (values, productValue) => (
  values.length === 0 || values.some((value) => value.toLowerCase() === String(productValue || '').toLowerCase())
);

export const normalizeCouponCode = (code) => String(code || '').trim().toUpperCase();

export const validateCouponDefinition = ({ discountType, discountValue, minimumPurchase, maximumDiscount, startDate, endDate, usageLimit }) => {
  if (!['PERCENTAGE', 'FIXED'].includes(discountType)) return 'Discount type must be PERCENTAGE or FIXED';
  if (!Number.isFinite(Number(discountValue)) || Number(discountValue) <= 0) return 'Discount value must be greater than 0';
  if (discountType === 'PERCENTAGE' && Number(discountValue) > 100) return 'Percentage discount cannot exceed 100%';
  if (Number(minimumPurchase || 0) < 0) return 'Minimum purchase cannot be negative';
  if (maximumDiscount !== undefined && maximumDiscount !== null && Number(maximumDiscount) < 0) return 'Maximum discount cannot be negative';
  if (!Number.isFinite(new Date(startDate).getTime()) || !Number.isFinite(new Date(endDate).getTime())) return 'Start date and end date must be valid dates';
  if (new Date(endDate) <= new Date(startDate)) return 'End date must be after start date';
  if (usageLimit !== undefined && (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) < 1)) return 'Usage limit must be a positive whole number';
  return null;
};

export const validateAndCalculateCoupon = async ({ couponCode, shopId, cartItems }) => {
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) return { status: 400, message: 'Coupon code is required' };
  if (!shopId || !Array.isArray(cartItems) || cartItems.length === 0) return { status: 400, message: 'Shop and cart items are required' };

  const coupon = await Coupon.findOne({ couponCode: normalizedCode, shopId });
  if (!coupon) return { status: 404, message: 'Coupon not found for this shop' };

  const now = new Date();
  if (!coupon.isActive) return { status: 422, message: 'Coupon is not active' };
  if (now < coupon.startDate) return { status: 422, message: 'Coupon has not started yet' };
  if (now > coupon.endDate) return { status: 422, message: 'Coupon has expired' };
  if (coupon.usedCount >= coupon.usageLimit) return { status: 422, message: 'Coupon usage limit reached' };

  const productIds = cartItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, shopId });
  if (products.length !== productIds.length) return { status: 422, message: 'Coupon belongs to another shop or cart has invalid products' };

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const normalizedItems = cartItems.map((item) => {
    const product = productMap.get(String(item.productId));
    const quantity = Number(item.quantity);
    return { product, quantity };
  });

  if (normalizedItems.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 1)) return { status: 400, message: 'Invalid cart quantity' };

  const offers = await Offer.find({
    productId: { $in: productIds },
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });
  const offerMap = new Map();
  offers.forEach((offer) => {
    if (!offerMap.has(offer.productId.toString()) && isOfferCurrentlyActive(offer, now)) {
      offerMap.set(offer.productId.toString(), offer);
    }
  });
  const pricedItems = normalizedItems.map(({ product, quantity }) => {
    const offer = offerMap.get(product._id.toString());
    const unitPrice = offer
      ? calculateDiscountedPrice(product.sellingPrice, offer.discountType, offer.discountValue)
      : product.sellingPrice;
    return { product, quantity, unitPrice };
  });
  const subtotal = pricedItems.reduce((sum, { unitPrice, quantity }) => sum + unitPrice * quantity, 0);
  if (subtotal < coupon.minimumPurchase) return { status: 422, message: `Minimum purchase of ₹${coupon.minimumPurchase} is required` };

  const applicableProducts = normalizeList(coupon.applicableProducts?.length ? coupon.applicableProducts : coupon.applicableProduct);
  const applicableBrands = normalizeList(coupon.applicableBrands?.length ? coupon.applicableBrands : coupon.applicableBrand);
  const applicableCategories = normalizeList(coupon.applicableCategories?.length ? coupon.applicableCategories : coupon.applicableCategory);
  const eligibleSubtotal = pricedItems.reduce((sum, { product, quantity, unitPrice }) => {
    const matches = applicableProducts.length === 0 || applicableProducts.map(String).includes(product._id.toString());
    const brandMatches = matchesRestriction(applicableBrands, product.brand);
    const categoryMatches = matchesRestriction(applicableCategories, product.category);
    return matches && brandMatches && categoryMatches ? sum + unitPrice * quantity : sum;
  }, 0);

  if (eligibleSubtotal <= 0) return { status: 422, message: 'Coupon is not applicable to the selected products' };

  let discount = coupon.discountType === 'PERCENTAGE'
    ? (eligibleSubtotal * coupon.discountValue) / 100
    : coupon.discountValue;
  if (coupon.maximumDiscount > 0) discount = Math.min(discount, coupon.maximumDiscount);
  discount = Math.min(discount, eligibleSubtotal, subtotal);
  discount = Math.round(discount * 100) / 100;

  return {
    coupon,
    couponCode: coupon.couponCode,
    subtotal: Math.round(subtotal * 100) / 100,
    eligibleSubtotal: Math.round(eligibleSubtotal * 100) / 100,
    pricedItems,
    discount,
    finalAmount: Math.round(Math.max(subtotal - discount, 0) * 100) / 100,
  };
};
