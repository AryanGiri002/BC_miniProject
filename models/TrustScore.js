import mongoose from 'mongoose';

const trustScoreSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true },
  score: { type: Number, default: 50, min: 0, max: 100 },
  events: [{
    type: {
      type: String,
      enum: ['DUPLICATE_UPLOAD', 'SALE_COMPLETED', 'MINT_CONFIRMED', 'LISTING_CANCELLED_FAST'],
    },
    delta: Number,
    tokenId: Number,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model('TrustScore', trustScoreSchema);
