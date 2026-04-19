import { Link } from 'react-router-dom';
import { TrustBadge } from '../trust/TrustBadge';
import { truncateAddress } from '../../lib/web3';

interface NFT {
  tokenId: number;
  name: string;
  fileUrl: string;
  price?: string;
  isListed: boolean;
  owner: string;
  inscriptionCount?: number;
  ownerTrustScore?: number;
}

interface NFTCardProps {
  nft: NFT;
}

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <Link
      to={`/nft/${nft.tokenId}`}
      className="nft-card block rounded-lg overflow-hidden transition-all duration-300"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
        <img
          src={nft.fileUrl}
          alt={nft.name}
          className="nft-card-image"
          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/111/333?text=NFT'; }}
        />
        {/* Inscription count watermark */}
        {(nft.inscriptionCount ?? 0) > 0 && (
          <div
            className="absolute bottom-2 left-2 text-xs font-mono opacity-70"
            style={{ color: 'var(--accent-gold-dim)' }}
          >
            ✦ {nft.inscriptionCount}
          </div>
        )}
        {/* Listed badge */}
        {nft.isListed && (
          <div
            className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(10,10,10,0.8)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold-dim)' }}
          >
            For Sale
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="font-serif text-lg leading-tight mb-1 truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {nft.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {truncateAddress(nft.owner)}
            </p>
            {nft.ownerTrustScore !== undefined && (
              <TrustBadge score={nft.ownerTrustScore} className="mt-1" />
            )}
          </div>
          {nft.isListed && nft.price && (
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Price</p>
              <p className="font-mono text-sm" style={{ color: 'var(--accent-gold)' }}>
                {nft.price} ETH
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
