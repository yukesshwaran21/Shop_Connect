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

export const getMyProducts = async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.json([]);
    }

    const products = await Product.find({ shopId: shop._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const shop = await Shop.findOne({ _id: product.shopId, ownerId: req.user._id });
    if (!shop) {
      return res.status(403).json({ message: 'You can only access your own products' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { productName, image, description, brand, category, originalPrice, sellingPrice, stock } = req.body;

    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(400).json({ message: 'Create a shop before adding products' });
    }

    if (!productName || !brand || !category || originalPrice === undefined || sellingPrice === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Missing required product information' });
    }

    if ([originalPrice, sellingPrice, stock].some((value) => Number.isNaN(Number(value)) || Number(value) < 0)) {
      return res.status(400).json({ message: 'Prices and stock must be non-negative numbers' });
    }

    const product = await Product.create({
      productName: productName.trim(),
      image: image || '',
      description: description || '',
      brand: brand.trim(),
      category: category.trim(),
      originalPrice: Number(originalPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      shopId: shop._id,
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
        product[field] = typeof req.body[field] === 'string' && ['productName', 'description', 'brand', 'category'].includes(field)
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    if ([product.originalPrice, product.sellingPrice, product.stock].some((value) => Number.isNaN(Number(value)) || Number(value) < 0)) {
      return res.status(400).json({ message: 'Prices and stock must be non-negative numbers' });
    }

    product.originalPrice = Number(product.originalPrice);
    product.sellingPrice = Number(product.sellingPrice);
    product.stock = Number(product.stock);

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
