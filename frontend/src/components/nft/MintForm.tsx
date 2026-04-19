import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useEdgeStore } from '../../lib/edgestore';
import { getContract } from '../../lib/web3';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

const mintSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required').max(1000),
  category: z.enum(['art', 'music', 'document', 'photography', 'other']),
  tags: z.string().optional(),
  royalty: z.number().min(1).max(10),
});

type MintFields = z.infer<typeof mintSchema>;

interface MintFormProps {
  walletAddress: string;
}

export function MintForm({ walletAddress }: MintFormProps) {
  const { edgestore } = useEdgeStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileUrl, setFileUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [mintDetails, setMintDetails] = useState<MintFields | null>(null);
  const [minting, setMinting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MintFields>({
    resolver: zodResolver(mintSchema),
    defaultValues: { category: 'art', royalty: 5 },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const id = toast.loading('Uploading your asset...');
    try {
      const res = await edgestore.nftImages.upload({
        file,
        input: {},
        onProgressChange: (p: number) => setUploadProgress(p),
      });
      setFileUrl(res.url);
      toast.success('Upload complete', { id });
      setStep(2);
    } catch (err: any) {
      toast.error(err.message, { id });
    } finally {
      setUploading(false);
    }
  }

  async function handleDetails(data: MintFields) {
    setMintDetails(data);
    setStep(3);
  }

  async function handleMint() {
    if (!mintDetails || !fileUrl) return;
    setMinting(true);
    const id = toast.loading('Preparing mint...');
    try {
      // 1. Prepare on server (hash + duplicate check)
      const prepRes = await fetch(`${API}/nft/prepare-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          name: mintDetails.name,
          description: mintDetails.description,
          category: mintDetails.category,
          tags: mintDetails.tags ?? '',
          royalty: mintDetails.royalty,
          walletAddress,
        }),
      });
      const prep = await prepRes.json();

      if (!prepRes.ok || !prep.success) {
        toast.error(prep.error, {
          id,
          description: prep.trustPenalty
            ? `Your Trust Score has been reduced by ${Math.abs(prep.trustPenalty)} points.`
            : undefined,
        });
        setMinting(false);
        return;
      }

      toast.info('Check MetaMask to sign the transaction', { id });

      // 2. Mint on-chain
      const contract = await getContract(true);
      const tx = await contract.mintNFT(prep.data.tokenURI, prep.data.fileHash);
      toast.loading('Transaction submitted, waiting for confirmation...', { id });
      const receipt = await tx.wait();

      // Extract tokenId from NFTMinted event
      const mintedEvent = receipt.logs
        .map((log: any) => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find((e: any) => e?.name === 'NFTMinted');
      const tokenId = mintedEvent ? Number(mintedEvent.args.tokenId) : null;

      // 3. Confirm on server
      await fetch(`${API}/nft/confirm-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.hash,
          tokenId,
          metadataId: prep.data.metadataId,
          walletAddress,
        }),
      });

      toast.success(`NFT minted! Token #${tokenId}`, { id });
      if (tokenId) navigate(`/nft/${tokenId}`);
    } catch (err: any) {
      const msg = err?.reason ?? err?.message ?? 'Transaction failed';
      toast.error(msg.includes('user rejected') ? 'Transaction cancelled' : msg, { id });
    } finally {
      setMinting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono"
              style={{
                background: step >= s ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                color: step >= s ? '#000' : 'var(--text-tertiary)',
                border: `1px solid ${step >= s ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              }}
            >
              {s}
            </div>
            {s < 3 && <div className="h-px w-8" style={{ background: 'var(--border-subtle)' }} />}
          </div>
        ))}
        <div className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {step === 1 ? 'Upload' : step === 2 ? 'Details' : 'Review & Mint'}
        </div>
      </div>

      {/* Step 1 — Upload */}
      {step === 1 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: '2px dashed var(--border-medium)', background: 'var(--bg-surface)' }}
        >
          <p className="font-serif text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Upload Your Asset
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Images up to 10MB. Documents up to 50MB.
          </p>
          {uploading ? (
            <div className="space-y-2">
              <div className="h-1 rounded overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, background: 'var(--accent-gold)' }}
                />
              </div>
              <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {uploadProgress}%
              </p>
            </div>
          ) : (
            <label
              className="cursor-pointer inline-block px-6 py-3 rounded text-sm"
              style={{ background: 'var(--accent-gold)', color: '#000', fontFamily: 'DM Sans' }}
            >
              Choose File
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            </label>
          )}
          {fileUrl && (
            <div className="mt-4">
              <img src={fileUrl} alt="Preview" className="mx-auto rounded" style={{ maxHeight: '200px' }} />
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <form onSubmit={handleSubmit(handleDetails)} className="space-y-5" autoComplete="off">
          <div>
            <label className="text-xs font-mono mb-1 block" style={{ color: 'var(--text-secondary)' }}>Name *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
              placeholder="My Digital Artwork"
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--trust-flagged)' }}>{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-mono mb-1 block" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
              placeholder="Describe your piece..."
            />
          </div>
          <div>
            <label className="text-xs font-mono mb-1 block" style={{ color: 'var(--text-secondary)' }}>Category</label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
            >
              <option value="art">Art</option>
              <option value="music">Music</option>
              <option value="photography">Photography</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono mb-1 block" style={{ color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
            <input
              {...register('tags')}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)' }}
              placeholder="digital, abstract, 2024"
            />
          </div>
          <div>
            <label className="text-xs font-mono mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Royalty: {watch('royalty')}%
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={watch('royalty')}
              onChange={e => setValue('royalty', Number(e.target.value), { shouldValidate: true })}
              className="w-full accent-[#C9A84C]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-2 rounded text-sm"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
            >
              Back
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded text-sm"
              style={{ background: 'var(--accent-gold)', color: '#000' }}
            >
              Review →
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Review & Mint */}
      {step === 3 && mintDetails && (
        <div className="space-y-6">
          <div className="rounded-lg p-5 space-y-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex gap-4">
              <img src={fileUrl} alt="Preview" className="w-20 h-20 rounded object-contain shrink-0" style={{ border: '1px solid var(--border-medium)' }} />
              <div>
                <h2 className="font-serif text-xl" style={{ color: 'var(--text-primary)' }}>{mintDetails.name}</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{mintDetails.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <span>Category: <span style={{ color: 'var(--text-secondary)' }}>{mintDetails.category}</span></span>
              <span>Royalty: <span style={{ color: 'var(--text-secondary)' }}>{mintDetails.royalty}%</span></span>
              {mintDetails.tags && <span className="col-span-2">Tags: <span style={{ color: 'var(--text-secondary)' }}>{mintDetails.tags}</span></span>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex-1 py-2.5 rounded text-sm"
              style={{ border: '1px solid var(--border-medium)', color: 'var(--text-secondary)' }}
              disabled={minting}
            >
              Back
            </button>
            <button onClick={handleMint} disabled={minting}
              className="flex-1 py-2.5 rounded text-sm font-medium disabled:opacity-50 transition-opacity"
              style={{ background: 'var(--accent-gold)', color: '#000' }}
            >
              {minting ? 'Minting...' : 'Mint NFT →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
