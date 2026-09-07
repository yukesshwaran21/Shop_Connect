import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'SHOP_OWNER', 'USER'],
      default: 'USER',
      required: true,
    },
    ownerId: { type: String, trim: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
