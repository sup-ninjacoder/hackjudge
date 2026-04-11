import { useState } from "react";
import Navbar from "../components/Navbar";
import TxBadge from "../components/TxBadge";
import { Send, Github, Globe, FileText, Users, Lightbulb, CheckCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Submit() {
  const [form, setForm] = useState({
    projectName: "",
    teamName: "",
    description: "",
    repoUrl: "",
    demoUrl: "",
    ipfsHash: "",
    submitterAddress: "",
  });
  const [status, setStatus] = useState("idle"); // idle | pending | success | error
  const [txHash, setTxHash] = useState("");
  const [projectId, setProjectId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("pending");
    setErrorMsg("");
    setTxHash("");

    try {
      const res = await fetch(`${API}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setTxHash(data.txHash);
      setProjectId(data.projectId);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-avax-dark">
        <Navbar />
        <div className="pt-28 pb-20 px-4 max-w-lg mx-auto text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-2">Project Submitted!</h1>
          <p className="text-avax-muted mb-6">Your submission has been anchored on Avalanche.</p>

          <div className="p-4 rounded-xl border border-avax-border bg-avax-card text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-avax-muted">Project ID</span>
              <span className="font-mono text-white">#{projectId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-avax-muted">Project</span>
              <span className="font-medium text-white">{form.projectName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-avax-muted">Team</span>
              <span className="font-medium text-white">{form.teamName}</span>
            </div>
            <div className="pt-2 border-t border-avax-border">
              <TxBadge txHash={txHash} status="onchain" label="Recorded on-chain" />
            </div>
          </div>

          <div className="flex gap-3">
            <a href={`/submissions/${projectId}`}
              className="flex-1 text-center px-4 py-2.5 rounded-lg border border-avax-border text-white text-sm hover:border-avax-red/40 transition-all">
              View Submission
            </a>
            <button onClick={() => { setStatus("idle"); setForm({ projectName:"", teamName:"", description:"", repoUrl:"", demoUrl:"", ipfsHash:"", submitterAddress:"" }); }}
              className="flex-1 px-4 py-2.5 rounded-lg bg-avax-red text-white text-sm font-semibold hover:bg-avax-red/90 transition-all">
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />
      <div className="pt-28 pb-20 px-4 max-w-2xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-2">Submit Your Project</h1>
          <p className="text-avax-muted text-sm">
            Your submission metadata will be hashed and anchored on Avalanche. The hash proves what you submitted and when.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              <Lightbulb size={14} className="inline mr-1 text-avax-red" /> Project Name *
            </label>
            <input
              name="projectName" value={form.projectName} onChange={handleChange}
              placeholder="e.g. DeFi Yield Optimizer"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-sm focus:border-avax-red/60 focus:ring-1 focus:ring-avax-red/30 outline-none transition-all"
            />
          </div>

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              <Users size={14} className="inline mr-1 text-avax-red" /> Team Name *
            </label>
            <input
              name="teamName" value={form.teamName} onChange={handleChange}
              placeholder="e.g. Team Avalanche"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-sm focus:border-avax-red/60 focus:ring-1 focus:ring-avax-red/30 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              <FileText size={14} className="inline mr-1 text-avax-red" /> Description *
            </label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Describe your project, what problem it solves, and what makes it unique…"
              required rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-sm focus:border-avax-red/60 focus:ring-1 focus:ring-avax-red/30 outline-none transition-all resize-none"
            />
          </div>

          {/* Repo URL */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              <Github size={14} className="inline mr-1 text-avax-red" /> Repository URL *
            </label>
            <input
              name="repoUrl" value={form.repoUrl} onChange={handleChange}
              placeholder="https://github.com/yourteam/project"
              required type="url"
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-sm focus:border-avax-red/60 focus:ring-1 focus:ring-avax-red/30 outline-none transition-all"
            />
          </div>

          {/* Demo URL */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              <Globe size={14} className="inline mr-1 text-avax-muted" /> Demo URL <span className="text-avax-muted">(optional)</span>
            </label>
            <input
              name="demoUrl" value={form.demoUrl} onChange={handleChange}
              placeholder="https://demo.yourproject.com"
              type="url"
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-sm focus:border-avax-red/60 outline-none transition-all"
            />
          </div>

          {/* IPFS / File hash — optional */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              IPFS Hash / File Hash <span className="text-avax-muted">(optional)</span>
            </label>
            <input
              name="ipfsHash" value={form.ipfsHash} onChange={handleChange}
              placeholder="Qm… or bafybei…"
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-xs font-mono focus:border-avax-red/60 outline-none transition-all"
            />
            <p className="text-xs text-avax-muted mt-1">Pin your project zip on IPFS (e.g. via web3.storage) and paste the CID.</p>
          </div>

          {/* Submitter address */}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Your Wallet Address <span className="text-avax-muted">(optional, for attribution)</span>
            </label>
            <input
              name="submitterAddress" value={form.submitterAddress} onChange={handleChange}
              placeholder="0x…"
              className="w-full px-4 py-2.5 rounded-lg bg-avax-card border border-avax-border text-white placeholder-avax-muted text-xs font-mono focus:border-avax-red/60 outline-none transition-all"
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* On-chain notice */}
          <div className="p-3 rounded-lg border border-avax-border bg-avax-card text-xs text-avax-muted">
            ⚡ Gas is sponsored for the demo. In production, teams would sign their own transactions.
          </div>

          <button
            type="submit"
            disabled={status === "pending"}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-avax-red text-white font-semibold hover:bg-avax-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-red"
          >
            {status === "pending" ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Anchoring on-chain…
              </>
            ) : (
              <>
                <Send size={16} /> Submit Project
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
