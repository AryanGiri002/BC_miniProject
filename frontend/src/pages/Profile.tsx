import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrustBadge } from '../components/trust/TrustBadge';
import { TrustHistory } from '../components/trust/TrustHistory';
import { NFTGrid } from '../components/nft/NFTGrid';
import { truncateAddress } from '../lib/web3';

const API = import.meta.env.VITE_API_URL;

type Tab = 'nfts' | 'listed' | 'trust';

export function Profile() {
  const { address } = useParams<{ address: string }>();
  const [trust, setTrust] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('nfts');

  useEffect(() => {
    if (!address) return;
    Promise.all([
      fetch(`${API}/trust/${address}`).then(r => r.json()),
      fetch(`${API}/user/${address}/nfts`).then(r => r.json()),
    ]).then(([trustRes, nftRes]) => {
      setTrust(trustRes.data ?? { score: 50, events: [] });
      setNfts(nftRes.data ?? []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [address]);

  const listed = nfts.filter(n => n.isListed);

  // Circular trust gauge
  const score = trust?.score ?? 50;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'nfts', label: `All NFTs (${nfts.length})` },
    { key: 'listed', label: `Listed (${listed.length})` },
    { key: 'trust', label: 'Trust History' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          className="rounded-lg p-8 mb-8 flex flex-col md:flex-row items-center gap-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Trust gauge */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle
                cx="70" cy="70" r={radius}
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={loading ? circumference : dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="70" y="65" textAnchor="middle" fill="var(--text-primary)" fontSize="24" fontFamily="Cormorant Garamond">
                {score}
              </text>
              <text x="70" y="82" textAnchor="middle" fill="var(--text-tertiary)" fontSize="11" fontFamily="DM Sans">
                / 100
              </text>
            </svg>
            {trust && <TrustBadge score={score} />}
          </div>

          {/* Address info */}
          <div>
            <p className="text-xs font-mono mb-2 uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Wallet
            </p>
            <h1 className="font-mono text-lg break-all" style={{ color: 'var(--text-primary)' }}>
              {address}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} · {listed.length} listed
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm transition-colors"
              style={{
                color: tab === t.key ? 'var(--accent-gold)' : 'var(--text-secondary)',
                borderBottom: tab === t.key ? '2px solid var(--accent-gold)' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'nfts' && <NFTGrid nfts={nfts} loading={loading} />}
        {tab === 'listed' && <NFTGrid nfts={listed} loading={loading} />}
        {tab === 'trust' && (
          <div className="max-w-xl">
            <TrustHistory events={trust?.events ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}
