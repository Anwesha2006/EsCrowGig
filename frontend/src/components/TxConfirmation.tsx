import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { TxReceipt } from "../types";
import { stellarExpertTxUrl } from "../lib/stellar";

export const TxConfirmation = ({ receipt }: { receipt: TxReceipt | null }) => {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(receipt.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-up rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] p-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#22C55E]">
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </span>
        <p className="font-bold text-[#15803D]">Transaction confirmed on Stellar Testnet</p>
      </div>

      {/* Action label */}
      {receipt.action && (
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[#16A34A]/70">
          {receipt.action}
        </p>
      )}

      {/* Hash row */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#DCFCE7] bg-white p-3">
        <p className="min-w-0 flex-1 break-all font-mono text-xs text-[#0D0D0D]">
          {receipt.hash}
        </p>
        <button
          onClick={copy}
          title="Copy tx hash"
          className="flex-none rounded-lg p-1.5 text-[#16A34A] transition hover:bg-[#DCFCE7]"
        >
          {copied
            ? <Check className="h-4 w-4" strokeWidth={3} />
            : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {/* Stellar Expert link */}
      <a
        href={stellarExpertTxUrl(receipt.hash)}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16A34A]"
      >
        View on Stellar Expert <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};
