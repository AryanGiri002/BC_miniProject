import { Router } from 'express';
import NFT from '../models/NFT.js';
import User from '../models/User.js';
import { getScore } from '../services/trustService.js';

const router = Router();

router.get('/:address/nfts', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const nfts = await NFT.find({ owner: address, status: { $ne: 'pending' } }).limit(20).sort({ createdAt: -1 });
    res.json({ success: true, data: nfts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:address/profile', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const [user, trust] = await Promise.all([
      User.findOne({ address }),
      getScore(address),
    ]);
    res.json({ success: true, data: { user, trust } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:address/profile', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const { username, bio, avatarUrl } = req.body;
    const user = await User.findOneAndUpdate(
      { address },
      { username, bio, avatarUrl },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
