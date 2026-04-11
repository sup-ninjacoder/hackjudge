import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import TxBadge from "../components/TxBadge";
import ScoreBar from "../components/ScoreBar";
import { Star, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const RUBRIC = [
  { key: "innovation",           label: "Innovation",            desc: "How novel and creative is the idea?" },
  { key: "technicalComplexity",  label: "Technical Complexity",  desc: "How technically impressive is the implementation?" },
  { key: "usefulness",           label: "Usefulness",            desc: "Does it solve a real problem?" },
  { key: "demoQuality",          label: "Demo Quality",          desc: "How polished and clear is the demo?" },
];

function ScoreSlider({ label, desc, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-avax-muted">{desc}</p>
        </div>
        <span className="text-2xl font-mono font-bold text-avax-red w-10 text-right">{value}</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #E84142 ${(value - 1) / 9 * 100}%, #2A2A2A ${(value - 1) / 9 * 100}%)`
        }}
      />
      <div className="flex justify-between text-xs text-avax-muted font-mono">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

function ProjectCard({ project, judgeKey, onScored }) {
  const [expanded, setExpanded]   = useState(false);
  const [scores, setScores]       = useState({ innovation: 7, technicalComplexity: 7, usefulness: 7, demoQuality: 7 });
  const [comment, setComment]     = useState("");
  const [status, setStatus]       = useState("idle");
  const [txHash, setTxHash]       = useState("");
  const [errorMsg, setErrorMsg]   = useState("");

  async function submitScore() {
    setStatus("pending");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          ...scores,
          comment,
          judgePrivateKey: judgeKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setTxHash(data.txHash);
      setStatus("success");
      onScored && onScored(project.id);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className={`rounded-xl border transition-all duration-200 ${expanded ? "border-avax-red/30" : "border-avax-border"} bg-avax-card`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-avax-red/10 border border-avax-red/20 flex items-center justify-center flex-shrink-0">
            <span className="text-avax-red font-mono font-bold text-sm">#{project.id}</span>
          </div>
          <div>
            <p className="font-display font-semibold text-white text-sm">{project.projectName}</p>
            <p className="text-xs text-avax-muted">{project.teamName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status === "success" && <TxBadge txHash={txHash} status="onchain" label="Scored" />}
          {expanded ? <ChevronUp size={16} className="text-avax-muted" /> : <ChevronDown size={16} className="text-avax-muted" />}
        </div>
      </button>

      {/* Expanded scoring panel */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-avax-border animate-fade-in">
          {/* Project details */}
          <div className="py-4 space-y-2 text-sm border-b border-avax-border mb-5">
            <p className="text-avax-muted leading-relaxed">{project.description || "No description available."}</p>
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-avax-red text-xs hover:underline">
                📁 Repository ↗
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-avax-red text-xs hover:underline ml-4">
                🖥 Demo ↗
              </a>
            )}
          </div>

          {status === "success" ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle size={32} className="text-green-400 mx-auto" />
              <p className="text-white font-medium">Score submitted!</p>
              <TxBadge txHash={txHash} status="onchain" label="Score on Avalanche" />
            </div>
          ) : (
            <>
              {/* Sliders */}
              <div className="space-y-5 mb-5">
                {RUBRIC.map(({ key, label, desc }) => (
                  <ScoreSlider
                    key={key}
                    label={label}
                    desc={desc}
                    value={scores[key]}
                    onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
                  />
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-3 border-t border-b border-avax-border mb-4 font-mono">
                <span className="text-avax-muted text-sm">Total Score</span>
                <span className="text-white font-bold text-xl">{total}<span className="text-avax-muted">/40</span></span>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm text-avax-muted mb-1.5">Comment (optional)</label>
                <textarea
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Feedback for the team…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-avax-dark border border-avax-border text-white placeholder-avax-muted text-sm outline-none focus:border-avax-red/60 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs mb-4">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              <button
                onClick={submitScore}
                disabled={status === "pending"}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-avax-red text-white font-semibold text-sm hover:bg-avax-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === "pending" ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Writing to chain…</>
                ) : (
                  <><Star size={14} fill="white" /> Submit Score</>
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Judge() {
  const [judgeKey, setJudgeKey]       = useState("");
  const [keyEntered, setKeyEntered]   = useState(false);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [scoredIds, setScoredIds]     = useState(new Set());

  async function loadProjects() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/submissions`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (_) {}
    setLoading(false);
  }

  function handleKeySubmit(e) {
    e.preventDefault();
    if (!judgeKey.trim()) return;
    setKeyEntered(true);
    loadProjects();
  }

  function handleScored(id) {
    setScoredIds((s) => new Set([...s, id]));
  }

  if (!keyEntered) {
    return (
      <div className="min-h-screen bg-avax-dark">
        <Navbar />
        <div className="pt-32 pb-20 px-4 max-w-md mx-auto animate-fade-in">
          <div className="p-8 rounded-2xl border border-avax-border bg-avax-card">
            <div className="w-12 h-12 rounded-xl bg-avax-red/10 border border-avax-red/20 flex items-center justify-center mb-6">
              <Star size={24} className="text-avax-red" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Judge Dashboard</h1>
            <p className="text-avax-muted text-sm mb-6">
              Enter your judge private key to begin scoring. Scores will be signed and sent to Avalanche.
            </p>

            <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-xs mb-6 flex items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>Demo mode: private key is used client-side only. In production, use MetaMask or a hardware wallet.</span>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Judge Private Key</label>
                <input
                  type="password"
                  value={judgeKey}
                  onChange={(e) => setJudgeKey(e.target.value)}
                  placeholder="0x…"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-avax-dark border border-avax-border text-white placeholder-avax-muted text-xs font-mono outline-none focus:border-avax-red/60 transition-all"
                />
                <p className="text-xs text-avax-muted mt-1">
                  Must be a registered judge wallet (admin registers via API).
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-avax-red text-white font-semibold text-sm hover:bg-avax-red/90 transition-all"
              >
                Enter Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Judge Dashboard</h1>
            <p className="text-avax-muted text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? "s" : ""} to review
              {scoredIds.size > 0 && <span className="text-green-400 ml-2">· {scoredIds.size} scored</span>}
            </p>
          </div>
          <button
            onClick={loadProjects}
            className="px-3 py-1.5 rounded-lg border border-avax-border text-avax-muted text-xs hover:text-white hover:border-avax-red/40 transition-all"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-avax-muted">
            <span className="w-8 h-8 border-2 border-avax-border border-t-avax-red rounded-full animate-spin inline-block mb-3" />
            <p className="text-sm">Loading submissions…</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-avax-border rounded-xl text-avax-muted">
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p>No projects submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                judgeKey={judgeKey}
                onScored={handleScored}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
