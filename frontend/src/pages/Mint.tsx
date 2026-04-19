import { useWallet } from '../hooks/useWallet';
import { MintForm } from '../components/nft/MintForm';
import { Link } from 'react-router-dom';

export function Mint() {
  const { address, connect, isConnecting, isConnected } = useWallet();

  return (
    <div className="min-h-screen pt-24 pb-16 px-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-mono tracking-widest mb-2 uppercase" style={{ color: 'var(--accent-gold)' }}>
            Create
          </p>
          <h1 className="font-serif text-5xl" style={{ color: 'var(--text-primary)' }}>Mint NFT</h1>
          <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
            Upload your digital asset, add metadata, and mint it on-chain.
          </p>
        </div>

        {!isConnected ? (
          <div
            className="rounded-lg p-10 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="font-serif text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Connect your wallet to mint
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              You need MetaMask connected to Ganache to create NFTs.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-8 py-3 rounded text-sm disabled:opacity-50"
              style={{ background: 'var(--accent-gold)', color: '#000' }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
              Make sure Ganache is running and MetaMask is set to Chain ID 1337
            </p>
          </div>
        ) : (
          <MintForm walletAddress={address!} />
        )}
      </div>
    </div>
  );
}
