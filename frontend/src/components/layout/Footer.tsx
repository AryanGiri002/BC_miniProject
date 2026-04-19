import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      className="mt-20 py-10 border-t"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link to="/" className="font-serif text-lg" style={{ color: 'var(--text-primary)' }}>
          NFT<span style={{ color: 'var(--accent-gold)' }}>Market</span>
        </Link>
        <div className="flex gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <Link to="/explore" className="hover:opacity-80">Explore</Link>
          <Link to="/mint" className="hover:opacity-80">Mint</Link>
        </div>
        <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
          Built on Ganache · Powered by Ethereum
        </p>
      </div>
    </footer>
  );
}
