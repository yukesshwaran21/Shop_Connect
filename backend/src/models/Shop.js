import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    paymentQrCode: { type: String, default: '' },
    description: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

shopSchema.index({ city: 1 });

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;
