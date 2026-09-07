import Order from '../models/Order.js';
import mongoose from 'mongoose';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Offer from '../models/Offer.js';
import Coupon from '../models/Coupon.js';
import { calculateDiscountedPrice, isOfferCurrentlyActive } from '../utils/pricing.js';
import { validateAndCalculateCoupon } from '../utils/couponService.js';

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { shopId, products, couponCode, deliveryAddress } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    const productIds = products.map((item) => item.productId);
    if (productIds.some((productId) => !mongoose.Types.ObjectId.isValid(productId))) {
      return res.status(400).json({ message: 'Cart contains an invalid product ID' });
    }
    const storedProducts = await Product.find({ _id: { $in: productIds }, shopId: shop._id });
    if (storedProducts.length !== productIds.length) {
      return res.status(400).json({ message: 'Cart contains an invalid product or shop' });
    }

    const storedProductMap = new Map(storedProducts.map((product) => [product._id.toString(), product]));
    const now = new Date();
    const serverProducts = [];

    for (const item of products) {
      const product = storedProductMap.get(item.productId.toString());
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        return res.status(400).json({ message: `Invalid quantity for ${product.productName}` });
      }

      const offers = await Offer.find({ productId: product._id, isActive: true, startDate: { $lte: now }, endDate: { $gte: now } });
      const activeOffer = offers.find((offer) => isOfferCurrentlyActive(offer, now));
      const price = activeOffer
        ? calculateDiscountedPrice(product.sellingPrice, activeOffer.discountType, activeOffer.discountValue)
        : product.sellingPrice;

      serverProducts.push({ product, quantity, price });
    }

    let couponResult = null;
    if (couponCode) {
      couponResult = await validateAndCalculateCoupon({
        couponCode,
        shopId,
        cartItems: products.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      if (couponResult.status) return res.status(couponResult.status).json({ message: couponResult.message });
    }
    if (couponResult?.pricedItems) {
      const pricedById = new Map(couponResult.pricedItems.map((item) => [item.product._id.toString(), item.unitPrice]));
      serverProducts.forEach((item) => { item.price = pricedById.get(item.product._id.toString()) ?? item.price; });
    }
    const orderItems = serverProducts.map(({ product, quantity, price }) => ({
      productId: product._id,
      name: product.productName,
      productName: product.productName,
      productImage: product.image || '',
      quantity,
      price,
      unitPrice: price,
      offerDiscount: Math.max(product.sellingPrice - price, 0),
      totalPrice: Math.round(price * quantity * 100) / 100,
    }));
    const effectiveSubtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const couponDiscount = couponResult?.discount || 0;
    const serverTotal = Math.max(effectiveSubtotal - couponDiscount, 0);

    let order;
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.productId, shopId: shop._id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!updated) throw new Error(`Insufficient stock for ${item.productName}`);
      }

      if (couponResult?.coupon?._id) {
        const updatedCoupon = await Coupon.findOneAndUpdate(
          { _id: couponResult.coupon._id, isActive: true, usedCount: { $lt: couponResult.coupon.usageLimit } },
          { $inc: { usedCount: 1 } },
          { new: true, session }
        );
        if (!updatedCoupon) throw new Error('Coupon usage limit reached');
      }

      [order] = await Order.create([{
        userId: req.user._id,
        shopId,
        ownerId: shop.ownerId,
        products: orderItems,
        items: orderItems,
        subtotal: Math.round(effectiveSubtotal * 100) / 100,
        totalAmount: Math.round(serverTotal * 100) / 100,
        couponId: couponResult?.coupon?._id,
        couponCode: couponResult?.couponCode || '',
        couponDiscount,
        deliveryAddress: {
          name: deliveryAddress?.name || req.user.name,
          email: deliveryAddress?.email || req.user.email,
          phone: deliveryAddress?.phone || '',
          address: deliveryAddress?.address || '',
          city: deliveryAddress?.city || '',
          state: deliveryAddress?.state || '',
          pincode: deliveryAddress?.pincode || '',
        },
        paymentStatus: 'Pending',
        orderStatus: 'Pending',
      }], { session });
    });

    res.status(201).json(order);
  } catch (error) {
    const status = error.message?.startsWith('Insufficient stock') || error.message === 'Coupon usage limit reached' ? 422 : 500;
    res.status(status).json({ message: error.message || 'Failed to create order' });
  } finally {
    await session.endSession();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate('shopId', 'shopName').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your orders' });
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('shopId', 'shopName');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role === 'USER' && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only access your own orders' });
    }
    if (req.user.role === 'SHOP_OWNER') {
      const shop = await Shop.findOne({ _id: order.shopId._id, ownerId: req.user._id });
      if (!shop) return res.status(403).json({ message: 'You can only access orders for your own shop' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch order' });
  }
};

export const getOrdersForOwner = async (req, res) => {
  try {
    const shops = await Shop.find({ ownerId: req.user._id }).select('_id shopName');
    const orders = await Order.find({ shopId: { $in: shops.map((shop) => shop._id) } })
      .populate('userId', 'name email')
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch owner orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const shop = await Shop.findOne({ _id: order.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only update orders for your own shop' });
    }

    const requestedStatus = req.body.status || req.body.orderStatus;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled'];
    const normalizedStatus = requestedStatus
      ? `${requestedStatus.charAt(0).toUpperCase()}${requestedStatus.slice(1).toLowerCase()}`
      : '';
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const transitions = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['Processing', 'Cancelled'],
      Processing: ['Ready'],
      Ready: ['Completed'],
      Completed: [],
      Cancelled: [],
    };
    if (normalizedStatus !== order.orderStatus && !transitions[order.orderStatus]?.includes(normalizedStatus)) {
      return res.status(400).json({ message: `Cannot move an order from ${order.orderStatus} to ${normalizedStatus}` });
    }

    order.orderStatus = normalizedStatus;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order status' });
  }
};
