import TrustScore from '../models/TrustScore.js';

export const TRUST_DELTAS = {
  DUPLICATE_UPLOAD: -15,
  SALE_COMPLETED: +5,
  MINT_CONFIRMED: +3,
  LISTING_CANCELLED_FAST: -3,
};

async function applyDelta(address, eventType, meta = {}) {
  const delta = TRUST_DELTAS[eventType];
  await TrustScore.findOneAndUpdate(
    { address: address.toLowerCase() },
    {
      $inc: { score: delta },
      $push: {
        events: {
          type: eventType,
          delta,
          tokenId: meta.tokenId,
          note: meta.note,
          timestamp: new Date(),
        },
      },
      $set: { lastUpdated: new Date() },
    },
    { upsert: true, new: true }
  );

  // Clamp score 0–100
  await TrustScore.updateOne(
    { address: address.toLowerCase() },
    [{ $set: { score: { $min: [100, { $max: [0, '$score'] }] } } }]
  );
}

export async function recordViolation(address, eventType, meta = {}) {
  return applyDelta(address, eventType, meta);
}

export async function recordPositiveAction(address, eventType, meta = {}) {
  return applyDelta(address, eventType, meta);
}

export async function getScore(address) {
  const doc = await TrustScore.findOne({ address: address.toLowerCase() });
  return doc ?? { score: 50, events: [] };
}
