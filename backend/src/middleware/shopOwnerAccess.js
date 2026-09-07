import Shop from '../models/Shop.js';

export const requireShopOwnership = async (req, res, next) => {
  try {
    const { shopId, productId } = req.params;
    const targetShopId = shopId || req.body.shopId;

    const shop = await Shop.findOne({
      _id: targetShopId || productId,
      ownerId: req.user._id,
    });

    if (!shop) {
      return res.status(403).json({ message: 'You do not have access to this shop data' });
    }

    req.shop = shop;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Shop ownership check failed' });
  }
};
