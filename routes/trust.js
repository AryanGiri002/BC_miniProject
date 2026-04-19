import { Router } from 'express';
import { getScore } from '../services/trustService.js';

const router = Router();

router.get('/:address', async (req, res) => {
  try {
    const score = await getScore(req.params.address);
    res.json({ success: true, data: score });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
