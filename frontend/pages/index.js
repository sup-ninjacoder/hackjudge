import Link from "next/link";
import Navbar from "../components/Navbar";
import { Send, Star, Trophy, Shield, Eye, Lock } from "lucide-react";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Home() {
  const [stats, setStats] = useState({ projects: 0, finalized: false });

  useEffect(() => {
    fetch(`${API}/api/submissions`)
      .then((r) => r.json())
      .then((d) => setStats((s) => ({ ...s, projects: d.total || 0 })))
      .catch(() => {});
  }, []);

  const features = [
    { icon: Shield, title: "Immutable Submissions", desc: "Each project is hashed and anchored on Avalanche. No one can secretly alter what was submitted or when." },
    { icon: Eye,    title: "Transparent Scoring",   desc: "Judge scores are written on-chain with timestamps. Every score is attributable to a wallet address." },
    { icon: Lock,   title: "Auditable Results",     desc: "Anyone can verify the leaderboard by reading the contract directly — no trust required." },
  ];

  const steps = [
    { icon: Send,   step: "01", title: "Teams Submit",   desc: "Submit project name, team, description, and repo link. A hash is anchored on-chain." },
    { icon: Star,   step: "02", title: "Judges Score",   desc: "Registered judges score each project on 4 criteria. Scores go directly to Avalanche." },
    { icon: Trophy, step: "03", title: "Results Ranked", desc: "Live leaderboard aggregates scores. Admin finalizes — results become permanently locked." },
  ];

  return (
    <div className="min-h-screen bg-avax-dark">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 max-w-6xl mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-avax-red/30 text-avax-red text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-avax-red animate-pulse" />
          Live on Avalanche Fuji Testnet
        </div>

        <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight">
          Hackathon judging
          <br />
          <span className="text-avax-red">you can verify.</span>
        </h1>

        <p className="text-avax-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Submissions anchored on-chain. Scores written transparently. Results anyone can audit.
          <br />
          <span className="text-sm">Not "always correct" — just impossible to secretly change.</span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-avax-red text-white font-semibold hover:bg-avax-red/90 transition-all glow-red animate-pulse-red">
            <Send size={16} /> Submit Project
          </Link>
          <Link href="/leaderboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-avax-border text-white font-semibold hover:border-avax-red/40 hover:text-avax-red transition-all">
            <Trophy size={16} /> View Leaderboard
          </Link>
        </div>

        {/* Live stat */}
        {stats.projects > 0 && (
          <p className="mt-8 text-avax-muted text-sm font-mono">
            <span className="text-avax-red font-bold">{stats.projects}</span> project{stats.projects !== 1 ? "s" : ""} submitted so far
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="font-display font-bold text-2xl text-white mb-10 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="relative p-6 rounded-xl border border-avax-border bg-avax-card animate-slide-up">
              <div className="text-5xl font-mono font-bold text-avax-border absolute top-4 right-4">{step}</div>
              <div className="w-10 h-10 rounded-lg bg-avax-red/10 border border-avax-red/20 flex items-center justify-center mb-4">
                <Icon size={20} className="text-avax-red" />
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
              <p className="text-avax-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto border-t border-avax-border">
        <h2 className="font-display font-bold text-2xl text-white mb-10 text-center">Why on-chain?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-avax-border bg-avax-card hover:border-avax-red/30 transition-all">
              <Icon size={24} className="text-avax-red mb-4" />
              <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
              <p className="text-avax-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-avax-border text-center text-avax-muted text-xs font-mono">
        HackJudge · Built on Avalanche Fuji · Open source
      </footer>
    </div>
  );
}
