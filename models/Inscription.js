import mongoose from 'mongoose';

const inscriptionSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true },
  author: { type: String, required: true, lowercase: true },
  message: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  timestamp: Date,
  createdAt: { type: Date, default: Date.now },
});

inscriptionSchema.index({ tokenId: 1, blockNumber: -1 });

export default mongoose.model('Inscription', inscriptionSchema);
