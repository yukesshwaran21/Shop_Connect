import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
