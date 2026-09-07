import Coupon from '../models/Coupon.js';
import Shop from '../models/Shop.js';

export const createCoupon = async (req, res) => {
  try {
    const { couponCode, discountType, discountValue, minimumPurchase, maximumDiscount, applicableBrand, applicableCategory, applicableProduct, startDate, endDate, usageLimit, shopId } = req.body;

    const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only create coupons for your own shop' });
    }

    const coupon = await Coupon.create({
      couponCode,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      applicableBrand,
      applicableCategory,
      applicableProduct,
      startDate,
      endDate,
      usageLimit,
      shopId,
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create coupon' });
  }
};

export const getCouponsByShop = async (req, res) => {
  try {
    const coupons = await Coupon.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch coupons' });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal, brand, category, productId, shopId } = req.body;

    const coupon = await Coupon.findOne({ couponCode: code.toUpperCase(), shopId });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const currentDate = new Date();
    if (currentDate < new Date(coupon.startDate) || currentDate > new Date(coupon.endDate)) {
      return res.status(400).json({ message: 'Coupon is not active' });
    }

    const matchesBrand = !coupon.applicableBrand || brand === coupon.applicableBrand;
    const matchesCategory = !coupon.applicableCategory || category === coupon.applicableCategory;
    const matchesProduct = !coupon.applicableProduct || productId === coupon.applicableProduct;

    if (subtotal < coupon.minimumPurchase || !matchesBrand || !matchesCategory || !matchesProduct) {
      return res.status(400).json({ message: 'Coupon is not applicable to this cart' });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) discount = coupon.maximumDiscount;
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      valid: true,
      couponCode: coupon.couponCode,
      discount,
      finalTotal: Math.max(subtotal - discount, 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Could not apply coupon' });
  }
};
