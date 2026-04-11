import { ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_BASE || "https://testnet.snowtrace.io";

export default function TxBadge({ txHash, status = "onchain", label }) {
  const icons = {
    pending: <Clock size={12} className="text-yellow-400" />,
    onchain: <CheckCircle size={12} className="text-green-400" />,
    error:   <AlertCircle size={12} className="text-red-400" />,
  };

  if (!txHash && status !== "pending") return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono status-${status}`}>
      {icons[status]}
      <span>{label || (status === "pending" ? "Sending to chain…" : "On-chain")}</span>
      {txHash && (
        <a
          href={`${EXPLORER}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
