export default function ScoreRing({ score, size = 52 }: { score: number | null; size?: number }) {
  if (score == null) {
    return (
      <div className="score-ring" style={{ width: size, height: size, ['--pct' as any]: 0 }}>
        <span style={{ fontSize: 10, color: 'var(--slate)', fontWeight: 600 }}>—</span>
      </div>
    );
  }
  const tier = score >= 85 ? 'tier-high' : score >= 65 ? 'tier-mid' : 'tier-low';
  return (
    <div className={`score-ring ${tier}`} style={{ width: size, height: size, ['--pct' as any]: score }}>
      <span className="score-value num">{score}</span>
    </div>
  );
}
