interface TrustBadgeProps {
  score: number;
  showScore?: boolean;
  className?: string;
}

function getTier(score: number) {
  if (score >= 85) return { label: 'Verified', color: 'var(--trust-verified)', icon: '✦' };
  if (score >= 65) return { label: 'Trusted', color: 'var(--trust-trusted)', icon: '●' };
  if (score >= 40) return { label: 'Neutral', color: 'var(--trust-neutral)', icon: '○' };
  if (score >= 20) return { label: 'Caution', color: 'var(--trust-caution)', icon: '⚠' };
  return { label: 'Flagged', color: 'var(--trust-flagged)', icon: '✕' };
}

export function TrustBadge({ score, showScore = false, className = '' }: TrustBadgeProps) {
  const tier = getTier(score);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-sans ${className}`}
      style={{
        border: `1px solid ${tier.color}40`,
        color: tier.color,
        background: `${tier.color}12`,
      }}
      title={`Trust Score: ${score}/100`}
    >
      <span style={{ fontSize: '9px' }}>{tier.icon}</span>
      <span>{tier.label}</span>
      {showScore && <span style={{ opacity: 0.7 }}>· {score}/100</span>}
    </span>
  );
}
