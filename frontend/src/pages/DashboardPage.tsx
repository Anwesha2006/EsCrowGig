import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, RefreshCw, Wallet } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useGigs } from "../hooks/useGigs";
import { useWallet } from "../hooks/useWallet";
import type { Gig } from "../types";

type RoleTab = "all" | "client" | "freelancer" | "arbiter";

const tabs: Array<{ id: RoleTab; label: string }> = [
  { id: "all", label: "AS ALL" },
  { id: "client", label: "AS CLIENT" },
  { id: "freelancer", label: "AS FREELANCER" },
  { id: "arbiter", label: "AS ARBITER" },
];

const short = (addr: string) =>
  addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : "—";

const roleBadgeStyle: Record<string, React.CSSProperties> = {
  Client: { background: "#EBF5FF", color: "#2B9BF4" },
  Freelancer: { background: "#EDE9FE", color: "#7C3AED" },
  Arbiter: { background: "#FEF3C7", color: "#D97706" },
};

const getRole = (gig: Gig, address: string) => {
  if (gig.client === address) return "Client";
  if (gig.freelancer === address) return "Freelancer";
  if (gig.arbiter === address) return "Arbiter";
  return null;
};

/* ── Gig card ─────────────────────────────────────────────────────────── */
const GigCard = ({ gig, address }: { gig: Gig; address: string }) => {
  const approved = gig.milestones.filter((m) => m.status === "Approved").length;
  const total = gig.milestones.length;
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
  const role = getRole(gig, address);
  const otherParty = role === "Client" ? gig.freelancer : gig.client;
  const currentStatus = gig.isActive
    ? (gig.milestones.find((m) => m.status !== "Approved")?.status ?? "Approved")
    : "Disputed";

  return (
    <Link
      to={`/gig/${gig.id}`}
      className="block rounded-2xl border border-border bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_4px_16px_rgba(43,155,244,0.12)] sm:p-5"
      style={{ boxShadow: "0 2px 8px rgba(43,155,244,0.06)" }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Gig #{gig.id}
            </span>
            {role && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={roleBadgeStyle[role]}
              >
                {role}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-extrabold text-ink sm:text-[15px]">
            {gig.totalFunded.toFixed(2)} XLM funded
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Address */}
      <p className="mt-2 truncate text-xs text-muted">
        Other party: {short(otherParty)}
      </p>

      {/* Progress */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-semibold text-body">
          {approved} of {total} milestones approved
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: "#2B9BF4" }}
          />
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-primary">
          {gig.totalFunded.toFixed(2)} XLM
        </span>
        {/* Always visible on mobile (no hover-only) */}
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary sm:text-sm">
          View Gig <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      </div>
    </Link>
  );
};

/* ── Disconnected / empty panel ───────────────────────────────────────── */
const PanelEmptyState = ({
  variant,
  onAction,
}: {
  variant: "disconnected" | "empty";
  onAction: () => void;
}) => (
  <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-primary-light sm:h-16 sm:w-16">
      <Wallet className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
    </div>
    <h3 className="mt-4 text-lg font-extrabold text-ink sm:text-xl">
      {variant === "disconnected" ? "Wallet Disconnected" : "No gigs yet"}
    </h3>
    <p className="mt-2 max-w-[260px] text-sm text-body sm:max-w-xs">
      {variant === "disconnected"
        ? "Connect your wallet to view your dashboard and manage your escrow gigs."
        : "Create your first escrow gig to get started."}
    </p>
    <button
      onClick={onAction}
      className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-primary px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white active:opacity-80"
    >
      {variant === "disconnected" ? "CONNECT NOW" : "CREATE GIG"}
    </button>
  </div>
);

/* ── Stats strip ──────────────────────────────────────────────────────── */
const StatsStrip = ({
  stats,
}: {
  stats: { label: string; value: string | number; color: string }[];
}) => (
  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
    {stats.map((s, i) => (
      <div
        key={s.label}
        className="animate-fade-up rounded-xl border border-border bg-white px-4 py-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(43,155,244,0.12)] sm:px-5 sm:py-4"
        style={{ animationDelay: `${i * 80}ms`, boxShadow: "0 1px 4px rgba(43,155,244,0.05)" }}
      >
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted sm:text-[11px]">
          {s.label}
        </span>
        <strong
          className="mt-1 block text-xl font-black sm:text-2xl"
          style={{ color: s.color }}
        >
          {s.value}
        </strong>
      </div>
    ))}
  </div>
);

/* ── Tab bar ──────────────────────────────────────────────────────────── */
const TabBar = ({
  activeTab,
  onChange,
}: {
  activeTab: RoleTab;
  onChange: (t: RoleTab) => void;
}) => (
  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <div className="flex w-max min-w-full gap-0.5 pb-px">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex-none whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold tracking-wide transition sm:px-4 sm:text-xs"
            style={
              active
                ? { background: "#2B9BF4", color: "#fff", boxShadow: "0 4px 14px rgba(43,155,244,0.3)" }
                : { background: "transparent", color: "#4A5568" }
            }
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = "#EBF5FF";
                (e.currentTarget as HTMLElement).style.color = "#2B9BF4";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#4A5568";
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

/* ── Page header ──────────────────────────────────────────────────────── */
const PageHeader = ({
  balance,
  isFetchingBalance,
  onRefresh,
}: {
  balance: string | null;
  isFetchingBalance: boolean;
  onRefresh: () => void;
}) => (
  <div className="animate-fade-up">
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted sm:text-[11px]">
      DASHBOARD&nbsp;// ESCROW
    </p>
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="page-title">Gig Dashboard</h1>
        <p className="page-copy mt-1 text-sm sm:text-base">
          Track your escrow gigs and milestone progress with on-chain precision.
        </p>
      </div>
      <div
        className="animate-fade-in flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-2.5 delay-200 sm:w-auto sm:justify-start"
        style={{ boxShadow: "0 1px 4px rgba(43,155,244,0.05)" }}
      >
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Balance</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-primary">
            {isFetchingBalance ? "…" : `${balance ?? "—"} XLM`}
          </span>
          <button
            onClick={onRefresh}
            disabled={isFetchingBalance}
            title="Refresh balance"
            className="text-muted transition hover:text-primary disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingBalance ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ── Main page ────────────────────────────────────────────────────────── */
export const DashboardPage = () => {
  const { gigs } = useGigs();
  const { address, isConnected, balance, isFetchingBalance, refreshBalance, openModal } =
    useWallet();
  const [activeTab, setActiveTab] = useState<RoleTab>("all");

  /* ── Disconnected state ── */
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-cloud">
        <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted sm:text-[11px]">
            DASHBOARD&nbsp;// ESCROW
          </p>
          <h1 className="page-title mt-2">Gig Dashboard</h1>
          <p className="page-copy mt-1 text-sm sm:text-base">
            Track your escrow gigs and milestone progress with on-chain precision.
          </p>

          <div className="mt-6">
            <TabBar activeTab="all" onChange={() => {}} />
          </div>

          <div
            className="mt-3 rounded-2xl border border-border bg-white"
            style={{ boxShadow: "0 2px 12px rgba(43,155,244,0.06)" }}
          >
            <PanelEmptyState variant="disconnected" onAction={openModal} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Connected state ── */
  const gigsByRole = {
    all: gigs,
    client: gigs.filter((g) => g.client === address),
    freelancer: gigs.filter((g) => g.freelancer === address),
    arbiter: gigs.filter((g) => g.arbiter === address),
  };

  const visible = gigsByRole[activeTab];

  const disputes = gigs.filter(
    (g) =>
      (g.client === address || g.freelancer === address || g.arbiter === address) &&
      g.milestones.some((m) => m.status === "Disputed")
  ).length;

  const xlmSecured = gigs
    .filter((g) => g.client === address)
    .reduce((sum, g) => sum + g.totalFunded, 0);

  const stats = [
    { label: "Gigs as Client", value: gigsByRole.client.length, color: "#2B9BF4" },
    { label: "As Freelancer", value: gigsByRole.freelancer.length, color: "#2B9BF4" },
    { label: "XLM Secured", value: xlmSecured.toFixed(2), color: "#22C55E" },
    { label: "Disputes", value: disputes, color: disputes > 0 ? "#EF4444" : "#9AA5B4" },
  ];

  return (
    <div className="min-h-screen bg-cloud">
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-20 sm:pt-10 md:pb-16">
        {/* Header */}
        <PageHeader
          balance={balance}
          isFetchingBalance={isFetchingBalance}
          onRefresh={refreshBalance}
        />

        {/* Stats */}
        <div className="mt-6 sm:mt-8">
          <StatsStrip stats={stats} />
        </div>

        {/* Tabs */}
        <div className="mt-6 sm:mt-8">
          <TabBar activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Panel */}
        <div
          className="mt-3 rounded-2xl border border-border bg-white"
          style={{ boxShadow: "0 2px 12px rgba(43,155,244,0.06)" }}
        >
          {visible.length === 0 ? (
            <PanelEmptyState variant="empty" onAction={() => window.location.assign("/create")} />
          ) : (
            <div className="grid gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-2">
              {visible.map((gig, i) => (
                <div key={gig.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <GigCard gig={gig} address={address} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB — mobile only, sits above bottom padding */}
      <Link
        to="/create"
        className="fixed bottom-5 right-4 grid h-14 w-14 place-items-center rounded-full text-white transition-opacity active:opacity-80 md:hidden"
        style={{ background: "#2B9BF4", boxShadow: "0 4px 14px rgba(43,155,244,0.4)" }}
        aria-label="Create a gig"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
};
