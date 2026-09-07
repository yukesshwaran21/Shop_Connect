import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error('MONGO_URI is not defined in the environment');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed. Please verify Atlas credentials, network access, and the MONGO_URI environment variable.');
    process.exit(1);
  }
};

export default connectDB;
