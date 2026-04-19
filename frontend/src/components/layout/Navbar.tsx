import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { truncateAddress } from '../../lib/web3';

export function Navbar() {
  const { address, connect, isConnecting, isConnected } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className="text-sm transition-colors duration-200 hover:opacity-100"
      style={{
        color: location.pathname === to ? 'var(--accent-gold)' : 'var(--text-secondary)',
        opacity: location.pathname === to ? 1 : 0.8,
      }}
    >
      {label}
    </Link>
  );

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backdropFilter: 'blur(12px)',
        background: scrolled ? 'rgba(10,10,10,0.9)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-serif text-xl tracking-wide" style={{ color: 'var(--text-primary)' }}>
          NFT<span style={{ color: 'var(--accent-gold)' }}>Market</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLink('/explore', 'Explore')}
          {navLink('/mint', 'Mint')}
          {isConnected && navLink(`/profile/${address}`, 'Profile')}
        </div>

        {/* Wallet */}
        <div>
          {isConnected && address ? (
            <Link
              to={`/profile/${address}`}
              className="font-mono text-xs px-3 py-2 rounded"
              style={{
                border: '1px solid var(--accent-gold-dim)',
                color: 'var(--accent-gold)',
                background: 'rgba(201,168,76,0.08)',
              }}
            >
              {truncateAddress(address)}
            </Link>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="text-sm px-4 py-2 rounded disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--accent-gold)', color: '#000', fontFamily: 'DM Sans' }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
