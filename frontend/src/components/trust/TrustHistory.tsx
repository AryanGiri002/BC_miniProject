interface TrustEvent {
  type: string;
  delta: number;
  tokenId?: number;
  timestamp: string;
  note?: string;
}

interface TrustHistoryProps {
  events: TrustEvent[];
}

const EVENT_LABELS: Record<string, string> = {
  DUPLICATE_UPLOAD: 'Duplicate upload attempt',
  SALE_COMPLETED: 'Sale completed',
  MINT_CONFIRMED: 'NFT minted',
  LISTING_CANCELLED_FAST: 'Listing cancelled early',
};

export function TrustHistory({ events }: TrustHistoryProps) {
  if (!events.length) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        No trust events yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.slice().reverse().map((ev, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 py-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {EVENT_LABELS[ev.type] ?? ev.type}
            </p>
            {ev.note && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {ev.note}
              </p>
            )}
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(ev.timestamp).toLocaleString()}
            </p>
          </div>
          <span
            className="text-sm font-mono shrink-0"
            style={{ color: ev.delta > 0 ? 'var(--trust-verified)' : 'var(--trust-flagged)' }}
          >
            {ev.delta > 0 ? '+' : ''}{ev.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
