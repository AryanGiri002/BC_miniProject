import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ColorPanels } from '@paper-design/shaders-react';
import { NFTGrid } from '../components/nft/NFTGrid';

const API = import.meta.env.VITE_API_URL;

export function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, listed: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/nft/all?sort=recent`).then(r => r.json()),
      fetch(`${API}/nft/stats`).then(r => r.json()),
    ])
      .then(([listed, stats]) => {
        setFeatured((listed.data ?? []).slice(0, 6));
        setStats({
          total: stats.data?.total ?? 0,
          listed: stats.data?.listed ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center gap-10">

        {/* ColorPanels shader */}
        <div className="rounded-xl overflow-hidden">
          <ColorPanels
            width={480}
            height={340}
            colors={['#ff9d00', '#fd4f30', '#809bff', '#6d2eff', '#333aff', '#f15cff', '#ffd557']}
            colorBack="#0A0A0A"
            density={3}
            angle1={0}
            angle2={0}
            length={1.1}
            edges={false}
            blur={0}
            fadeIn={1}
            fadeOut={0.3}
            gradient={0}
            speed={0.5}
            scale={1.0}
          />
        </div>

        {/* Text */}
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-mono tracking-widest mb-3 uppercase" style={{ color: 'var(--accent-gold)' }}>
            Blockchain · NFT · Legacy
          </p>
          <h1 className="font-serif text-6xl md:text-8xl leading-none mb-3 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
            Own the <span style={{ color: 'var(--accent-gold)' }}>Unrepeatable</span>
          </h1>
          <p className="text-lg mb-6 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            A decentralized marketplace where every digital asset carries its history —
            verified on-chain, inscribed by its owners.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/explore"
              className="px-8 py-3 rounded text-sm font-medium"
              style={{ background: 'var(--accent-gold)', color: '#000' }}
            >
              Explore Collection
            </Link>
            <Link
              to="/mint"
              className="px-8 py-3 rounded text-sm"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
            >
              Mint Your NFT
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono tracking-widest">SCROLL</span>
            <div className="w-px h-8" style={{ background: 'var(--border-medium)' }} />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="border-y py-6"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-16">
          {[
            { label: 'Total Minted', value: stats.total },
            { label: 'Listed for Sale', value: stats.listed },
            { label: 'Blockchain', value: 'Ganache' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-3xl" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-mono tracking-widest mb-2 uppercase" style={{ color: 'var(--accent-gold)' }}>
              Featured
            </p>
            <h2 className="font-serif text-4xl" style={{ color: 'var(--text-primary)' }}>
              Recent Listings
            </h2>
          </div>
          <Link to="/explore" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            View all →
          </Link>
        </div>
        <NFTGrid nfts={featured} loading={loading} />
      </section>

      {/* Trust Score feature callout */}
      <section
        className="border-t border-b py-16"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
      >
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-mono tracking-widest mb-3 uppercase" style={{ color: 'var(--accent-gold)' }}>
              Novel Feature
            </p>
            <h2 className="font-serif text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Trust Score</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every wallet earns a transparent trust score based on their marketplace behaviour.
              Buyers see seller scores before transacting — reducing fraud without intermediaries.
            </p>
          </div>
          <div>
            <p className="text-xs font-mono tracking-widest mb-3 uppercase" style={{ color: 'var(--accent-gold)' }}>
              Novel Feature
            </p>
            <h2 className="font-serif text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Legacy Inscriptions</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              When owners pass on an NFT, they may inscribe a permanent message on-chain.
              Every inscription stacks — turning each piece into a living cultural artifact.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
