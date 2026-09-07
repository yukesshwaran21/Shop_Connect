import Order from '../models/Order.js';
import Shop from '../models/Shop.js';

export const createOrder = async (req, res) => {
  try {
    const { shopId, products, totalAmount, paymentStatus, orderStatus } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const order = await Order.create({
      userId: req.user._id,
      shopId,
      ownerId: shop.ownerId,
      products,
      totalAmount,
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
