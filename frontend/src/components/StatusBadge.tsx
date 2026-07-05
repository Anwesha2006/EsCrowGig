import type { MilestoneStatus } from "../types";

const classes: Record<MilestoneStatus, string> = {
  Pending: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Disputed: "bg-red-100 text-red-800"
};

export const StatusBadge = ({ status }: { status: MilestoneStatus }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-bold ${classes[status]}`}>{status}</span>
);

