import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Inscription {
  author: string;
  message: string;
  timestamp: number;
  blockNumber: number;
}

interface InscriptionViewerProps {
  imageUrl: string;
  tokenId: number;
  currentOwner: string;
  connectedAddress: string | null;
  inscriptions: Inscription[];
  hasInscribed: boolean;
  onInscribe: (message: string) => Promise<void>;
}

function getTiltFromAddress(address: string): number {
  const seed = address.slice(-6).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const raw = ((seed % 9) - 4);
  return raw === 0 ? 1.5 : raw;
}

function getVerticalNudge(address: string): number {
  const seed = address.slice(-4).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (seed % 10) - 5;
}

function formatDate(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts * 1000);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function InscriptionViewer({
  imageUrl,
  tokenId,
  currentOwner,
  connectedAddress,
  inscriptions,
  hasInscribed,
  onInscribe,
}: InscriptionViewerProps) {
  const [flipped, setFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [inscribing, setInscribing] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    if (modalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const isOwner = connectedAddress?.toLowerCase() === currentOwner?.toLowerCase();
  const canInscribe = isOwner && !hasInscribed;

  async function handleInscribe() {
    if (!draft.trim()) return;
    setInscribing(true);
    try {
      await onInscribe(draft.trim());
      setDraft('');
      setModalOpen(false);
      toast.success('Inscription saved on-chain');
    } catch (e: any) {
      toast.error(e.message ?? 'Transaction failed');
    } finally {
      setInscribing(false);
    }
  }

  return (
    <>
      <div className="inscription-wrapper">
        {/* 3D flip scene */}
        <div className="card-flip-scene">
          <div className={`card-flip-inner ${flipped ? 'flipped' : ''}`}>

            {/* FRONT — NFT image */}
            <div className="card-face card-front">
              <img
                src={imageUrl}
                alt={`NFT #${tokenId}`}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/111/333?text=NFT'; }}
              />
            </div>

            {/* BACK — postcard */}
            <div className="card-face card-back">
              <div className="postcard-back">
                {/* Left — handwritten inscriptions */}
                <div className="postcard-messages">
                  <p className="postcard-label">Inscriptions</p>
                  {inscriptions.length === 0 ? (
                    <p className="postcard-empty">No inscriptions yet.</p>
                  ) : (
                    inscriptions.map((ins, i) => {
                      const tilt = getTiltFromAddress(ins.author);
                      const nudge = getVerticalNudge(ins.author);
                      return (
                        <div
                          key={i}
                          className="postcard-note"
                          style={{ animationDelay: `${400 + i * 150}ms` }}
                        >
                          <p className="postcard-text">"{ins.message}"</p>
                          <p className="postcard-sig">
                            — {ins.author.slice(0, 6)}...{ins.author.slice(-4)}
                            <span className="postcard-date">{formatDate(ins.timestamp)}</span>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Vertical divider */}
                <div className="postcard-divider" />

                {/* Right — stamp / address area */}
                <div className="postcard-stamp-area">
                  <div className="postcard-stamp-box">
                    <span className="postcard-token">TOKEN<br />#{tokenId}</span>
                  </div>
                  <p className="postcard-addr">
                    {currentOwner.slice(0, 6)}...{currentOwner.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="inscription-bottom-bar">
          <span style={{ color: 'var(--accent-gold-dim)', fontFamily: 'DM Sans', fontSize: '12px' }}>
            ✦ {inscriptions.length} inscription{inscriptions.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {canInscribe && (
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--accent-gold)', border: '1px solid var(--accent-gold-dim)' }}
              >
                + Add yours
              </button>
            )}
            <button
              onClick={() => setFlipped(v => !v)}
              className="text-xs py-1 rounded"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-medium)', width: '80px' }}
            >
              {flipped ? 'Close ×' : 'Inspect ↗'}
            </button>
          </div>
        </div>
      </div>

      {/* Inscription modal */}
      {modalOpen && (
        <div className="inscription-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="inscription-modal" onClick={e => e.stopPropagation()}>
            <div className="inscription-modal-header">
              <h3>Leave your mark</h3>
              <button onClick={() => setModalOpen(false)}>×</button>
            </div>
            <textarea
              className="inscription-modal-textarea"
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 280))}
              placeholder="Leave your mark on this piece..."
              disabled={inscribing}
              autoFocus
            />
            <div className="inscription-modal-footer">
              <span>{draft.length}/280</span>
              <button
                onClick={handleInscribe}
                disabled={!draft.trim() || inscribing}
              >
                {inscribing ? 'Inscribing...' : 'Inscribe on-chain →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
