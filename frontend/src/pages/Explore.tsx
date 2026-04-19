import { useEffect, useState, useCallback } from 'react';
import { NFTGrid } from '../components/nft/NFTGrid';

const API = import.meta.env.VITE_API_URL;

const CATEGORIES = ['all', 'art', 'photography'];
const SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'inscriptions', label: 'Most Inscribed' },
];

export function Explore() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('recent');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchNFTs = useCallback(async () => {
    setLoading(true);
    try {
      let url = '';
      if (debouncedQuery) {
        url = `${API}/nft/search?q=${encodeURIComponent(debouncedQuery)}${category !== 'all' ? `&category=${category}` : ''}`;
      } else {
        url = `${API}/nft/all?sort=${sort}${category !== 'all' ? `&category=${category}` : ''}`;
      }
      const r = await fetch(url);
      const d = await r.json();
      setNfts(d.data ?? []);
    } catch {
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, sort]);

  useEffect(() => { fetchNFTs(); }, [fetchNFTs]);

  return (
    <div className="min-h-screen pt-20 pb-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-10">
          <p className="text-xs font-mono tracking-widest mb-2 uppercase" style={{ color: 'var(--accent-gold)' }}>
            Collection
          </p>
          <h1 className="font-serif text-5xl" style={{ color: 'var(--text-primary)' }}>Explore</h1>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, description, or tag..."
            className="flex-1 px-4 py-2.5 rounded text-sm outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2.5 rounded text-sm outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
          >
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs capitalize transition-all"
              style={{
                background: category === cat ? 'var(--accent-gold)' : 'var(--bg-surface)',
                color: category === cat ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${category === cat ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <NFTGrid nfts={nfts} loading={loading} />
      </div>
    </div>
  );
}
