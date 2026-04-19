import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { handler as edgeStoreHandler } from './edgestore.js';
import nftRoutes from './routes/nft.js';
import userRoutes from './routes/user.js';
import trustRoutes from './routes/trust.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// EdgeStore file upload proxy — must use app.use so req.url is stripped of the /edgestore prefix
app.use('/edgestore', edgeStoreHandler);

// API routes
app.use('/api/nft', nftRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trust', trustRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
