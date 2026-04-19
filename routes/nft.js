import { Router } from 'express';
import crypto from 'crypto';
import NFT from '../models/NFT.js';
import Inscription from '../models/Inscription.js';
import { recordViolation, recordPositiveAction } from '../services/trustService.js';
import { checkHashExists, getInscriptionsFromChain, getProvider } from '../services/contractService.js';

const router = Router();

async function computeFileHash(fileUrl) {
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(buffer));
  return '0x' + hash.digest('hex');
}

// GET /api/nft/stats
router.get('/stats', async (req, res) => {
  try {
    const total = await NFT.countDocuments({ status: { $in: ['minted', 'listed'] } });
    const listed = await NFT.countDocuments({ isListed: true });
    res.json({ success: true, data: { total, listed } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/nft/all
router.get('/all', async (req, res) => {
  try {
    const { sort = 'recent', minPrice, maxPrice, category, minTrust } = req.query;
    const query = { status: { $in: ['minted', 'listed'] }, isListed: true };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = minPrice;
      if (maxPrice) query.price.$lte = maxPrice;
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'inscriptions') sortObj = { inscriptionCount: -1 };
    const nfts = await NFT.find(query).sort(sortObj).limit(20);
    res.json({ success: true, data: nfts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/nft/search
router.get('/search', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const query = { status: 'minted' };
    if (q) query.$text = { $search: q };
    if (category) query.category = category;
    const nfts = await NFT.find(query).limit(20);
    res.json({ success: true, data: nfts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/nft/:tokenId/inscriptions
router.get('/:tokenId/inscriptions', async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);

    // Always fetch from chain — it's the source of truth
    const onChain = await getInscriptionsFromChain(tokenId);

    // Sync cache: upsert each event so we never lose or duplicate
    for (const i of onChain) {
      await Inscription.updateOne(
        { tokenId, blockNumber: i.blockNumber },
        { $set: { tokenId, author: i.author.toLowerCase(), message: i.message, blockNumber: i.blockNumber, timestamp: new Date(i.timestamp * 1000) } },
        { upsert: true }
      );
    }

    res.json({ success: true, data: onChain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/nft/:tokenId
router.get('/:tokenId', async (req, res) => {
  try {
    const nft = await NFT.findOne({ tokenId: parseInt(req.params.tokenId) });
    if (!nft) return res.status(404).json({ success: false, error: 'NFT not found' });
    res.json({ success: true, data: nft });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/nft/metadata/:id  (serves tokenURI metadata JSON)
router.get('/metadata/:id', async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) return res.status(404).json({ error: 'Not found' });
    res.json({
      name: nft.name,
      description: nft.description,
      image: nft.fileUrl,
      attributes: [
        { trait_type: 'category', value: nft.category },
        { trait_type: 'royalty', value: nft.royaltyPercent },
        { trait_type: 'fileHash', value: nft.fileHash },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/nft/prepare-mint
router.post('/prepare-mint', async (req, res) => {
  try {
    const { fileUrl, name, description, category, tags, royalty, walletAddress } = req.body;
    if (!fileUrl || !name || !walletAddress) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const fileHash = await computeFileHash(fileUrl);

    const alreadyMinted = await checkHashExists(fileHash);
    if (alreadyMinted) {
      await recordViolation(walletAddress, 'DUPLICATE_UPLOAD', {
        note: 'Attempted to mint duplicate file',
      });
      return res.status(409).json({
        success: false,
        error: 'This file has already been minted. Duplicate upload recorded.',
        trustPenalty: -15,
      });
    }

    const existingInDB = await NFT.findOne({ fileHash });
    if (existingInDB && existingInDB.status !== 'pending') {
      await recordViolation(walletAddress, 'DUPLICATE_UPLOAD', {
        note: 'Attempted to mint duplicate file (DB check)',
      });
      return res.status(409).json({
        success: false,
        error: 'This file has already been minted.',
        trustPenalty: -15,
      });
    }

    // Save pending NFT
    const nft = await NFT.create({
      name,
      description,
      category: category || 'other',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      fileUrl,
      fileHash,
      royaltyPercent: royalty || 5,
      creator: walletAddress.toLowerCase(),
      owner: walletAddress.toLowerCase(),
      status: 'pending',
    });

    const tokenURI = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/nft/metadata/${nft._id}`;

    res.json({
      success: true,
      data: {
        tokenURI,
        fileHash,
        metadataId: nft._id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nft/confirm-mint
router.post('/confirm-mint', async (req, res) => {
  try {
    const { txHash, tokenId, metadataId, walletAddress } = req.body;

    await NFT.findByIdAndUpdate(metadataId, {
      tokenId: parseInt(tokenId),
      txHash,
      status: 'minted',
    });

    await recordPositiveAction(walletAddress, 'MINT_CONFIRMED', {
      tokenId: parseInt(tokenId),
      note: 'First successful mint',
    });

    res.json({ success: true, data: { tokenId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nft/confirm-sale
router.post('/confirm-sale', async (req, res) => {
  try {
    const { txHash, tokenId, sellerAddress, buyerAddress } = req.body;

    await NFT.findOneAndUpdate(
      { tokenId: parseInt(tokenId) },
      {
        owner: buyerAddress.toLowerCase(),
        isListed: false,
        status: 'minted',
        price: null,
        txHash,
      }
    );

    await recordPositiveAction(sellerAddress, 'SALE_COMPLETED', {
      tokenId: parseInt(tokenId),
      note: 'Verified sale completed on-chain',
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nft/confirm-list
router.post('/confirm-list', async (req, res) => {
  try {
    const { tokenId, price } = req.body;
    await NFT.findOneAndUpdate(
      { tokenId: parseInt(tokenId) },
      { isListed: true, status: 'listed', price: price.toString() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nft/inscription-added  (webhook called after inscription tx)
router.post('/inscription-added', async (req, res) => {
  try {
    const { tokenId, author, message, blockNumber, timestamp } = req.body;

    // Upsert by blockNumber — never wipe existing inscriptions
    await Inscription.updateOne(
      { tokenId: parseInt(tokenId), blockNumber },
      { $set: { tokenId: parseInt(tokenId), author: author.toLowerCase(), message, blockNumber, timestamp: new Date(timestamp * 1000) } },
      { upsert: true }
    );

    await NFT.findOneAndUpdate(
      { tokenId: parseInt(tokenId) },
      { $inc: { inscriptionCount: 1 } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
