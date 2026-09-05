import ScoreRing from './ScoreRing';
import { getProfileCompletion } from '@/lib/profileCompletion';

export default function ProfileCompletionCard({ profile }: { profile: Parameters<typeof getProfileCompletion>[0] }) {
  const { percent, items } = getProfileCompletion(profile);
  return (
    <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
      <ScoreRing score={percent} size={64} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
          {percent === 100 ? 'Your profile is complete' : 'Profile strength'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
          {items.map((item) => (
            <span key={item.label} style={{ fontSize: 12.5, color: item.done ? 'var(--teal)' : 'var(--slate)' }}>
              {item.done ? '✔' : '✘'} {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
