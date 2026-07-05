import type { MilestoneStatus } from "../types";

const classes: Record<MilestoneStatus, string> = {
  Pending: "bg-[#F1F5F9] text-[#64748B]",
  Submitted: "bg-[#FEF3C7] text-[#D97706]",
  Approved: "bg-[#DCFCE7] text-[#16A34A]",
  Disputed: "bg-[#FEE2E2] text-[#DC2626]"
};

export const StatusBadge = ({ status }: { status: MilestoneStatus }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[status]}`}>{status}</span>
);
