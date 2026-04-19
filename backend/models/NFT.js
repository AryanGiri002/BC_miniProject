import mongoose from 'mongoose';

const nftSchema = new mongoose.Schema({
  tokenId: { type: Number, unique: true, sparse: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['art', 'music', 'document', 'photography', 'other'], default: 'other' },
  tags: [String],
  fileUrl: { type: String, required: true },
  fileHash: { type: String, required: true, unique: true },
  tokenURI: String,
  creator: { type: String, required: true, lowercase: true },
  owner: { type: String, required: true, lowercase: true },
  price: String,
  isListed: { type: Boolean, default: false },
  royaltyPercent: { type: Number, min: 1, max: 10 },
  txHash: String,
  status: { type: String, enum: ['pending', 'minted', 'listed', 'sold'], default: 'pending' },
  inscriptionCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

nftSchema.index({ name: 'text', description: 'text', tags: 'text' });
nftSchema.index({ category: 1 });
nftSchema.index({ isListed: 1, createdAt: -1 });

export default mongoose.model('NFT', nftSchema);
