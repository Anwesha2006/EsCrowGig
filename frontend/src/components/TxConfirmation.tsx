import { ExternalLink } from "lucide-react";
import type { TxReceipt } from "../types";
import { stellarExpertTxUrl } from "../lib/stellar";

export const TxConfirmation = ({ receipt }: { receipt: TxReceipt | null }) => {
  if (!receipt) {
    return null;
  }

  return (
    <div className="rounded-[16px] border border-[#DCFCE7] bg-[#F0FDF4] p-4">
      <p className="text-sm font-bold text-[#16A34A]">Transaction confirmed</p>
      <p className="mt-1 break-all text-sm text-body">{receipt.hash}</p>
      <a
        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#16A34A]"
        href={stellarExpertTxUrl(receipt.hash)}
        target="_blank"
        rel="noreferrer"
      >
        View on Stellar Expert <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};
