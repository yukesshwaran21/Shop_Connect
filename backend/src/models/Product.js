import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    originalPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, shopId: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
