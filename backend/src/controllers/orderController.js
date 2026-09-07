import Order from '../models/Order.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Offer from '../models/Offer.js';
import { calculateDiscountedPrice, isOfferCurrentlyActive } from '../utils/pricing.js';

export const createOrder = async (req, res) => {
  try {
    const { shopId, products, totalAmount, paymentStatus, orderStatus } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    const productIds = products.map((item) => item.productId);
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

      serverProducts.push({
        productId: product._id,
        name: product.productName,
        quantity,
        price,
      });
    }

    const serverTotal = serverProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      userId: req.user._id,
      shopId,
      ownerId: shop.ownerId,
      products: serverProducts,
      totalAmount: Math.round(serverTotal * 100) / 100,
      paymentStatus: paymentStatus || 'Pending',
      orderStatus: orderStatus || 'Pending',
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create order' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your orders' });
  }
};

export const getOrdersForOwner = async (req, res) => {
  try {
    const orders = await Order.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch owner orders' });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      ownerId: req.user._id,
    });

    if (!order) {
      return res.status(403).json({ message: 'You can only update orders for your own shop' });
    }

    order.orderStatus = req.body.orderStatus || order.orderStatus;
    order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order status' });
  }
};
