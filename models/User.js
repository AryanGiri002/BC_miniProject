import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true },
  username: String,
  bio: String,
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
