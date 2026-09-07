import Shop from '../models/Shop.js';
import Product from '../models/Product.js';

export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch shops' });
  }
};

export const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your shops' });
  }
};

export const createShop = async (req, res) => {
  try {
    const {
      shopName,
      logo,
      paymentQrCode,
      description,
      address,
      city,
      category,
      contactNumber,
    } = req.body;

    if (!shopName || !address || !city || !category || !contactNumber) {
      return res.status(400).json({ message: 'Missing required shop information' });
    }

    const existing = await Shop.findOne({ ownerId: req.user._id, shopName: new RegExp(shopName, 'i') });
    if (existing) {
      return res.status(400).json({ message: 'You already have a shop with a similar name' });
    }

    const shop = await Shop.create({
      shopName: shopName.trim(),
      logo: logo || '',
      paymentQrCode: paymentQrCode || '',
      description: description || '',
      address: address.trim(),
      city: city.trim(),
      category: category.trim(),
      contactNumber: contactNumber.trim(),
      ownerId: req.user._id,
    });

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create shop' });
  }
};

export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (req.user && req.user.role === 'SHOP_OWNER' && shop.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have access to this shop' });
    }

    res.json({
      _id: shop._id,
      shopName: shop.shopName,
      logo: shop.logo,
      description: shop.description,
      address: shop.address,
      city: shop.city,
      contactNumber: shop.contactNumber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch shop' });
  }
};

export const searchShops = async (req, res) => {
  try {
    const { category, city } = req.query;
    if (!category?.trim() || !city?.trim()) {
      return res.status(400).json({ message: 'Category and city are required' });
    }

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const shops = await Product.aggregate([
      { $match: { category: { $regex: `^${escapeRegex(category.trim())}$`, $options: 'i' } } },
      {
        $lookup: {
          from: 'shops',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shop',
        },
      },
      { $unwind: '$shop' },
      { $match: { 'shop.city': { $regex: `^${escapeRegex(city.trim())}$`, $options: 'i' } } },
      {
        $group: {
          _id: '$shop._id',
          shopName: { $first: '$shop.shopName' },
          logo: { $first: '$shop.logo' },
          description: { $first: '$shop.description' },
          city: { $first: '$shop.city' },
          address: { $first: '$shop.address' },
          contactNumber: { $first: '$shop.contactNumber' },
          categories: { $addToSet: '$category' },
        },
      },
      { $sort: { shopName: 1 } },
    ]);

    res.json({ success: true, shops });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search shops' });
  }
};

export const getDiscoveryOptions = async (req, res) => {
  try {
    const [categories, cities] = await Promise.all([
      Product.distinct('category'),
      Shop.distinct('city'),
    ]);
    res.json({
      categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
      cities: cities.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load discovery options' });
  }
};

export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.shopId,
      ownerId: req.user._id,
    });

    if (!shop) {
      return res.status(403).json({ message: 'You can only update your own shop' });
    }

    const fields = ['shopName', 'logo', 'paymentQrCode', 'description', 'address', 'city', 'category', 'contactNumber'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'string') {
          shop[field] = req.body[field].trim();
        } else {
          shop[field] = req.body[field];
        }
      }
    });

    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update shop' });
  }
};
