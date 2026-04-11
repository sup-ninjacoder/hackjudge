export default function ScoreBar({ label, value, max = 10 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-avax-muted">{label}</span>
        <span className="font-mono font-medium text-white">{value}<span className="text-avax-muted">/{max}</span></span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
