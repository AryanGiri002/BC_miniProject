import { NFTCard } from './NFTCard';

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

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg overflow-hidden animate-pulse"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="bg-[#1A1A1A]" style={{ aspectRatio: '1/1' }} />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-[#1A1A1A] rounded w-3/4" />
        <div className="h-3 bg-[#1A1A1A] rounded w-1/2" />
      </div>
    </div>
  );
}

export function NFTGrid({ nfts, loading = false }: NFTGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--text-tertiary)' }}>
        <p className="font-serif text-2xl mb-2">Nothing here yet</p>
        <p className="text-sm">Be the first to mint an NFT</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {nfts.map(nft => <NFTCard key={nft.tokenId} nft={nft} />)}
    </div>
  );
}
