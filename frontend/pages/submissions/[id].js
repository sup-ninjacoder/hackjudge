import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import TxBadge from "../../components/TxBadge";
import ScoreBar from "../../components/ScoreBar";
import { ArrowLeft, ExternalLink, Shield, Hash } from "lucide-react";

const API      = process.env.NEXT_PUBLIC_API_URL       || "http://localhost:4000";
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_BASE || "https://testnet.snowtrace.io";

function ScoreCard({ score, index }) {
  const total = score.innovation + score.technicalComplexity + score.usefulness + score.demoQuality;
  const avg   = (total / 4).toFixed(1);

  return (
    <div className="p-4 rounded-xl border border-avax-border bg-avax-dark animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-mono text-avax-muted">Judge</p>
          <a
            href={`${EXPLORER}/address/${score.judge}`}
            target="_blank" rel="noreferrer"
            className="text-xs font-mono text-avax-red hover:underline"
          >
            {score.judge.slice(0, 8)}…{score.judge.slice(-6)}
            <ExternalLink size={9} className="inline ml-1" />
          </a>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-white text-xl">{avg}<span className="text-avax-muted text-sm">/10</span></p>
          <p className="text-xs text-avax-muted">{new Date(score.scoredAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <ScoreBar label="Innovation"           value={score.innovation} />
        <ScoreBar label="Technical Complexity" value={score.technicalComplexity} />
        <ScoreBar label="Usefulness"           value={score.usefulness} />
        <ScoreBar label="Demo Quality"         value={score.demoQuality} />
      </div>

      {score.comment && (
        <blockquote className="text-xs text-avax-muted italic border-l-2 border-avax-red/40 pl-3 mt-3">
          "{score.comment}"
        </blockquote>
      )}
    </div>
  );
}

export default function SubmissionDetail() {
  const router = useRouter();
  const { id }  = router.query;

  const [project, setProject] = useState(null);
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/submissions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setProject(d.project);
        setScores(d.scores || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-32 text-center text-avax-muted">
        <span className="w-8 h-8 border-2 border-avax-border border-t-avax-red rounded-full animate-spin inline-block mb-3" />
        <p className="text-sm">Loading from chain…</p>
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-32 text-center text-red-400">{error || "Project not found"}</div>
    </div>
  );

  const avgTotal = scores.length
    ? (scores.reduce((a, s) => a + s.innovation + s.technicalComplexity + s.usefulness + s.demoQuality, 0) / scores.length / 4).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-3xl mx-auto animate-fade-in">
        {/* Back */}
        <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-avax-muted text-sm hover:text-white transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Leaderboard
        </Link>

        {/* Project header */}
        <div className="p-6 rounded-2xl border border-avax-border bg-avax-card mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-mono text-avax-muted">#{project.id}</span>
              <h1 className="font-display font-bold text-2xl text-white mt-0.5">{project.projectName}</h1>
              <p className="text-avax-muted">{project.teamName}</p>
            </div>
            {avgTotal && (
              <div className="text-right flex-shrink-0">
                <p className="font-mono font-bold text-3xl text-avax-red">{avgTotal}</p>
                <p className="text-xs text-avax-muted">avg score / 10</p>
              </div>
            )}
          </div>

          <p className="text-sm text-avax-muted leading-relaxed mb-4">
            {project.description || "No description provided."}
          </p>

          {/* Links */}
          <div className="flex flex-wrap gap-3 mb-4">
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-avax-border text-xs text-avax-muted hover:text-avax-red hover:border-avax-red/40 transition-all">
                📁 Repository <ExternalLink size={10} />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-avax-border text-xs text-avax-muted hover:text-avax-red hover:border-avax-red/40 transition-all">
                🖥 Demo <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* On-chain metadata */}
          <div className="pt-4 border-t border-avax-border space-y-2">
            <p className="text-xs font-semibold text-avax-muted flex items-center gap-1">
              <Shield size={12} /> On-chain record
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-avax-dark border border-avax-border">
                <p className="text-avax-muted mb-0.5">Submitted by</p>
                <a href={`${EXPLORER}/address/${project.submitter}`} target="_blank" rel="noreferrer"
                  className="text-avax-red hover:underline break-all">
                  {project.submitter}
                </a>
              </div>
              <div className="p-2 rounded-lg bg-avax-dark border border-avax-border">
                <p className="text-avax-muted mb-0.5">Submitted at</p>
                <span className="text-white">{new Date(project.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-avax-dark border border-avax-border text-xs font-mono">
              <p className="text-avax-muted mb-0.5 flex items-center gap-1"><Hash size={10} /> Metadata hash (keccak256)</p>
              <span className="text-white break-all">{project.metadataHash}</span>
            </div>

            {project.txHash && (
              <div className="mt-2">
                <TxBadge txHash={project.txHash} status="onchain" label="Submission tx on Avalanche" />
              </div>
            )}

            {project.ipfsHash && (
              <div className="p-2 rounded-lg bg-avax-dark border border-avax-border text-xs font-mono">
                <p className="text-avax-muted mb-0.5">IPFS CID</p>
                <a href={`https://ipfs.io/ipfs/${project.ipfsHash}`} target="_blank" rel="noreferrer"
                  className="text-avax-red hover:underline break-all">{project.ipfsHash}</a>
              </div>
            )}
          </div>
        </div>

        {/* Scores */}
        <h2 className="font-display font-semibold text-lg text-white mb-4">
          Judge Scores <span className="text-avax-muted font-mono text-sm ml-2">{scores.length} submitted</span>
        </h2>

        {scores.length === 0 ? (
          <div className="text-center py-12 border border-avax-border rounded-xl text-avax-muted text-sm">
            No scores recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {scores.map((s, i) => (
              <ScoreCard key={s.judge} score={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
