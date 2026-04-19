import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { EdgeStoreProvider } from './lib/edgestore';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Mint } from './pages/Mint';
import { NFTPage } from './pages/NFTPage';
import { Profile } from './pages/Profile';

function App() {
  return (
    <EdgeStoreProvider basePath={import.meta.env.VITE_EDGESTORE_BASE_URL}>
      <BrowserRouter>
        <Toaster position="bottom-right" theme="dark" richColors />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/nft/:tokenId" element={<NFTPage />} />
          <Route path="/profile/:address" element={<Profile />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </EdgeStoreProvider>
  );
}

export default App;
