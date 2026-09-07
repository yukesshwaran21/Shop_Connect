import Product from '../models/Product.js';
import Shop from '../models/Shop.js';

export const getProductsByShop = async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch products' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { shopId, productName, image, description, brand, category, originalPrice, sellingPrice, stock } = req.body;

    const shop = await Shop.findOne({ _id: shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only add products to your own shop' });
    }

    const product = await Product.create({
      productName,
      image,
      description,
      brand,
      category,
      originalPrice,
      sellingPrice,
      stock,
      shopId,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only edit your own shop products' });
    }

    const fields = ['productName', 'image', 'description', 'brand', 'category', 'originalPrice', 'sellingPrice', 'stock'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only delete products from your own shop' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete product' });
  }
};
