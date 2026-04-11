import Link from "next/link";
import { useRouter } from "next/router";
import { Trophy, Send, Star, Home, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Navbar() {
  const router = useRouter();
  const [contractAddr, setContractAddr] = useState("");
  const [explorerBase, setExplorerBase] = useState("https://testnet.snowtrace.io");

  useEffect(() => {
    fetch(`${API}/api/contract-info`)
      .then((r) => r.json())
      .then((d) => {
        setContractAddr(d.address);
        setExplorerBase(d.explorerUrl?.split("/address/")[0] || explorerBase);
      })
      .catch(() => {});
  }, []);

  const links = [
    { href: "/",          label: "Home",       icon: Home },
    { href: "/submit",    label: "Submit",     icon: Send },
    { href: "/judge",     label: "Judge",      icon: Star },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-avax-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-avax-red font-display font-bold text-lg tracking-tight">
            ⬡ HackJudge
          </span>
          <span className="text-xs text-avax-muted font-mono hidden sm:block">on Avalanche</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-150
                  ${active
                    ? "bg-avax-red/10 text-avax-red"
                    : "text-avax-muted hover:text-white hover:bg-white/5"
                  }`}
              >
                <Icon size={14} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}

          {/* Contract link */}
          {contractAddr && (
            <a
              href={`${explorerBase}/address/${contractAddr}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 ml-2 px-2 py-1 rounded text-xs font-mono text-avax-muted border border-avax-border hover:border-avax-red/40 hover:text-avax-red transition-all"
              title={contractAddr}
            >
              <span>{contractAddr.slice(0, 6)}…{contractAddr.slice(-4)}</span>
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
