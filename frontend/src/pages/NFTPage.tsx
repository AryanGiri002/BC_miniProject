import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWallet } from '../hooks/useWallet';
import { getContract, formatEth, parseEth, truncateAddress } from '../lib/web3';
import { TrustBadge } from '../components/trust/TrustBadge';
import { InscriptionViewer } from '../components/nft/InscriptionViewer';

const API = import.meta.env.VITE_API_URL;

export function NFTPage() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { address } = useWallet();
  const [nft, setNft] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [hasInscribed, setHasInscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [listing, setListing] = useState(false);
  const [listPrice, setListPrice] = useState('');
  const [showListInput, setShowListInput] = useState(false);

  useEffect(() => {
    if (!tokenId) return;
    Promise.all([
      fetch(`${API}/nft/${tokenId}`).then(r => r.json()),
      fetch(`${API}/nft/${tokenId}/inscriptions`).then(r => r.json()),
    ]).then(([nftRes, insRes]) => {
      const n = nftRes.data;
      setNft(n);
      setInscriptions(insRes.data ?? []);
      if (n?.owner) {
        fetch(`${API}/trust/${n.owner}`).then(r => r.json()).then(d => setTrust(d.data));
      }
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [tokenId]);

  useEffect(() => {
    if (!address || !tokenId || !nft) return;
    getContract().then(async contract => {
      const inscribed = await contract.hasInscribed(tokenId, address);
      setHasInscribed(inscribed);
    }).catch(() => {});
  }, [address, tokenId, nft]);

  async function handleBuy() {
    if (!nft || !address) return;
    setBuying(true);
    const id = toast.loading('Check MetaMask to sign the transaction');
    try {
      const contract = await getContract(true);
      const item = await contract.getMarketItem(nft.tokenId);
      const tx = await contract.buyNFT(nft.tokenId, { value: item.price });
      toast.loading('Transaction submitted, waiting for confirmation...', { id });
      const receipt = await tx.wait();

      await fetch(`${API}/nft/confirm-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.hash,
          tokenId: nft.tokenId,
          sellerAddress: nft.owner,
          buyerAddress: address,
        }),
      });

      toast.success('You now own this NFT', { id });
      setNft((prev: any) => ({ ...prev, owner: address.toLowerCase(), isListed: false }));
    } catch (err: any) {
      const msg = err?.reason ?? err?.message ?? 'Transaction failed';
      toast.error(msg.includes('user rejected') ? 'Transaction cancelled' : msg, { id });
    } finally {
      setBuying(false);
    }
  }

  async function handleList() {
    if (!listPrice || !nft) return;
    setListing(true);
    const id = toast.loading('Check MetaMask to sign the transaction');
    try {
      const contract = await getContract(true);
      const priceWei = parseEth(listPrice);
      const tx = await contract.listNFT(nft.tokenId, priceWei);
      toast.loading('Transaction submitted...', { id });
      const receipt = await tx.wait();

      await fetch(`${API}/nft/confirm-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: nft.tokenId, price: listPrice }),
      });

      toast.success(`NFT listed for ${listPrice} ETH`, { id });
      setNft((prev: any) => ({ ...prev, isListed: true, price: listPrice }));
      setShowListInput(false);
    } catch (err: any) {
      const msg = err?.reason ?? err?.message ?? 'Transaction failed';
      toast.error(msg.includes('user rejected') ? 'Transaction cancelled' : msg, { id });
    } finally {
      setListing(false);
    }
  }

  async function handleInscribe(message: string) {
    const contract = await getContract(true);
    const id = toast.loading('Check MetaMask to sign the transaction');
    try {
      const tx = await contract.addInscription(nft.tokenId, message);
      toast.loading('Transaction submitted...', { id });
      const receipt = await tx.wait();

      const newIns = { author: address!, message, timestamp: Math.floor(Date.now() / 1000), blockNumber: receipt.blockNumber };
      setInscriptions(prev => [newIns, ...prev]);
      setHasInscribed(true);

      await fetch(`${API}/nft/inscription-added`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: nft.tokenId, author: address, message, blockNumber: receipt.blockNumber, timestamp: newIns.timestamp }),
      });

      toast.success('Inscription saved on-chain', { id });
    } catch (err: any) {
      const msg = err?.reason ?? err?.message ?? 'Transaction failed';
      toast.error(msg.includes('user rejected') ? 'Transaction cancelled' : msg, { id });
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-pulse text-center">
          <div className="w-64 h-64 rounded-lg mx-auto mb-4" style={{ background: 'var(--bg-surface)' }} />
          <div className="h-6 w-48 rounded mx-auto" style={{ background: 'var(--bg-surface)' }} />
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>NFT not found.</p>
      </div>
    );
  }

  const isOwner = address?.toLowerCase() === nft.owner?.toLowerCase();
  const canBuy = nft.isListed && !isOwner && address;

  return (
    <div className="min-h-screen pt-20 pb-16 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 py-10">
        {/* Left — Inscription Viewer */}
        <div>
          <InscriptionViewer
            imageUrl={nft.fileUrl}
            tokenId={nft.tokenId}
            currentOwner={nft.owner}
            connectedAddress={address ?? null}
            inscriptions={inscriptions}
            hasInscribed={hasInscribed}
            onInscribe={handleInscribe}
          />
        </div>

        {/* Right — Details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Token #{nft.tokenId} · {nft.category}
            </p>
            <h1 className="font-serif text-4xl" style={{ color: 'var(--text-primary)' }}>{nft.name}</h1>
            {nft.description && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{nft.description}</p>
            )}
          </div>

          {/* Owner + Trust */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>Current Owner</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                {truncateAddress(nft.owner)}
                {isOwner && <span className="ml-2 text-xs" style={{ color: 'var(--accent-gold)' }}>(you)</span>}
              </p>
              {trust && <TrustBadge score={trust.score} showScore />}
            </div>
          </div>

          {/* Price / Buy */}
          {nft.isListed && nft.price && (
            <div
              className="rounded-lg p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-tertiary)' }}>Listed Price</p>
              <p className="font-serif text-3xl" style={{ color: 'var(--accent-gold)' }}>{nft.price} ETH</p>
              {canBuy && (
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="mt-4 w-full py-3 rounded text-sm font-medium disabled:opacity-50 transition-opacity"
                  style={{ background: 'var(--accent-gold)', color: '#000' }}
                >
                  {buying ? 'Processing...' : 'Buy Now'}
                </button>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && !nft.isListed && (
            <div>
              {showListInput ? (
                <div className="flex gap-2">
                  <input
                    value={listPrice}
                    onChange={e => setListPrice(e.target.value)}
                    placeholder="Price in ETH"
                    className="flex-1 px-3 py-2 rounded text-sm outline-none font-mono"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={handleList}
                    disabled={listing || !listPrice}
                    className="px-4 py-2 rounded text-sm disabled:opacity-50"
                    style={{ background: 'var(--accent-gold)', color: '#000' }}
                  >
                    {listing ? '...' : 'List'}
                  </button>
                  <button
                    onClick={() => setShowListInput(false)}
                    className="px-3 py-2 rounded text-sm"
                    style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowListInput(true)}
                  className="w-full py-3 rounded text-sm"
                  style={{ border: '1px solid var(--accent-gold-dim)', color: 'var(--accent-gold)' }}
                >
                  List for Sale
                </button>
              )}
            </div>
          )}

          {/* File hash */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-tertiary)' }}>File Hash (SHA-256)</p>
            <p
              className="text-xs font-mono break-all cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => { navigator.clipboard.writeText(nft.fileHash); toast.info('Hash copied'); }}
            >
              {nft.fileHash}
            </p>
          </div>

          {/* Tags */}
          {nft.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nft.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
