import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    couponCode: { type: String, required: true, uppercase: true, trim: true },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumPurchase: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: 0, min: 0 },
    applicableBrands: { type: [String], default: [] },
    applicableCategories: { type: [String], default: [] },
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    applicableBrand: { type: String, default: '' },
    applicableCategory: { type: String, default: '' },
    applicableProduct: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.index({ shopId: 1, couponCode: 1 }, { unique: true });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
