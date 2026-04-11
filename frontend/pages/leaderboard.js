import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ScoreBar from "../components/ScoreBar";
import { Trophy, Medal, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const API      = process.env.NEXT_PUBLIC_API_URL     || "http://localhost:4000";
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_BASE || "https://testnet.snowtrace.io";

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="w-8 h-8 rounded-full border border-avax-border bg-avax-dark flex items-center justify-center font-mono text-sm text-avax-muted">{rank}</span>;
}

function ScoreCircle({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? "#4ade80" : score >= 5 ? "#E84142" : "#666";
  return (
    <div className="flex flex-col items-center">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="#2A2A2A" strokeWidth="4" />
        <circle
          cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 22}`}
          strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="28" y="33" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace">
          {score.toFixed(1)}
        </text>
      </svg>
      <span className="text-xs text-avax-muted mt-1">avg/10</span>
    </div>
  );
}

function LeaderboardRow({ entry, isExpanded, onToggle }) {
  return (
    <div className={`rounded-xl border transition-all duration-200 ${isExpanded ? "border-avax-red/30" : "border-avax-border"} bg-avax-card`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Rank */}
        <div className="w-10 flex-shrink-0 flex items-center justify-center">
          <RankBadge rank={entry.rank} />
        </div>

        {/* Project info */}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate">{entry.projectName}</p>
          <p className="text-xs text-avax-muted">{entry.teamName}</p>
        </div>

        {/* Judge count */}
        <div className="hidden sm:block text-center">
          <p className="text-xs font-mono text-white">{entry.judgeCount}</p>
          <p className="text-xs text-avax-muted">judge{entry.judgeCount !== 1 ? "s" : ""}</p>
        </div>

        {/* Score circle */}
        <ScoreCircle score={entry.avgScore} />

        {/* Expand */}
        <div className="text-avax-muted ml-2">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-avax-border animate-fade-in">
          <p className="text-sm text-avax-muted py-4 leading-relaxed">
            {entry.description || "No description available."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {entry.repoUrl && (
              <a href={entry.repoUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-avax-red hover:underline">
                📁 Repository <ExternalLink size={10} />
              </a>
            )}
            {entry.demoUrl && (
              <a href={entry.demoUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-avax-red hover:underline">
                🖥 Demo <ExternalLink size={10} />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-avax-border">
            <Link href={`/submissions/${entry.id}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-avax-border text-avax-muted hover:text-white hover:border-avax-red/40 transition-all">
              View full detail →
            </Link>
            <span className="text-xs font-mono text-avax-muted">
              Submitted {new Date(entry.submittedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Leaderboard() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [expanded, setExpanded] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/leaderboard`);
      const d   = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d.leaderboard || []);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(iv);
  }, [load]);

  return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy size={28} className="text-avax-red" />
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Leaderboard</h1>
              <p className="text-xs text-avax-muted font-mono">
                Scores aggregated from on-chain records · auto-refreshes every 30s
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-avax-border text-avax-muted text-xs hover:text-white hover:border-avax-red/40 transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Last refresh timestamp */}
        {lastRefresh && !loading && (
          <p className="text-xs text-avax-muted font-mono mb-4">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && data.length === 0 ? (
          <div className="text-center py-20 text-avax-muted">
            <span className="w-8 h-8 border-2 border-avax-border border-t-avax-red rounded-full animate-spin inline-block mb-3" />
            <p className="text-sm">Fetching scores from chain…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 border border-avax-border rounded-xl text-avax-muted">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p>No submissions yet. <Link href="/submit" className="text-avax-red hover:underline">Be the first!</Link></p>
          </div>
        ) : (
          <>
            {/* Top 3 podium highlight */}
            {data.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[data[1], data[0], data[2]].map((p, i) => p && (
                  <div key={p.id}
                    className={`rounded-xl border p-3 text-center ${i === 1 ? "border-yellow-500/30 bg-yellow-500/5" : "border-avax-border bg-avax-card"}`}
                  >
                    <div className={`text-2xl mb-1 ${i === 1 ? "text-3xl" : ""}`}>
                      {i === 0 ? "🥈" : i === 1 ? "🥇" : "🥉"}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{p.projectName}</p>
                    <p className="text-xs text-avax-muted truncate">{p.teamName}</p>
                    <p className="font-mono font-bold text-avax-red mt-1 text-sm">{p.avgScore.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Full list */}
            <div className="space-y-3">
              {data.map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  isExpanded={expanded === entry.id}
                  onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                />
              ))}
            </div>

            {/* Audit note */}
            <div className="mt-8 p-4 rounded-xl border border-avax-border bg-avax-card text-xs text-avax-muted">
              <p className="font-medium text-white mb-1">🔍 Verify these results yourself</p>
              <p>All scores are written on-chain. Read the contract directly at:</p>
              <a
                href={`${EXPLORER}/address/${data[0]?.submitter || ""}`}
                target="_blank" rel="noreferrer"
                className="text-avax-red font-mono hover:underline break-all"
              >
                {EXPLORER}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
