import { ExternalLink } from "lucide-react";
import type { TxReceipt } from "../types";
import { stellarExpertTxUrl } from "../lib/stellar";

export const TxConfirmation = ({ receipt }: { receipt: TxReceipt | null }) => {
  if (!receipt) {
    return null;
  }

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-bold text-emerald-900">Transaction confirmed</p>
      <p className="mt-1 break-all text-sm text-emerald-800">{receipt.hash}</p>
      <a
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900"
        href={stellarExpertTxUrl(receipt.hash)}
        target="_blank"
        rel="noreferrer"
      >
        View on Stellar Expert <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};

