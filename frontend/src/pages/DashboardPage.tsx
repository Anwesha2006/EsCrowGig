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

const getRole = (
  gig: Gig,
  address: string
): "Client" | "Freelancer" | "Arbiter" | null => {
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
      className="group block rounded-2xl border border-border bg-white p-5 transition-all duration-200 hover:border-primary"
      style={{ boxShadow: "0 2px 8px rgba(43,155,244,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Gig #{gig.id}
            </span>
            {role && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={roleBadgeStyle[role]}
              >
                {role}
              </span>
            )}
          </div>
          <p className="mt-1 text-[15px] font-extrabold text-ink">
            {gig.totalFunded.toFixed(2)} XLM funded
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <p className="mt-2 text-xs text-muted">
        Other party: {short(otherParty)}
      </p>

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

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-primary">
          {gig.totalFunded.toFixed(2)} XLM
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition group-hover:opacity-100">
          View Gig <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

/* ── Empty state inside the panel ─────────────────────────────────────── */
const EmptyState = ({ onConnect }: { onConnect: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-primary-light">
      <Wallet className="h-7 w-7 text-primary" />
    </div>
    <h3 className="mt-5 text-xl font-extrabold text-ink">No gigs yet</h3>
    <p className="mt-2 max-w-xs text-sm text-body">
      Create your first escrow gig or connect a wallet with existing gigs to get
      started.
    </p>
    <button
      onClick={onConnect}
      className="mt-6 inline-flex items-center gap-2 rounded-[10px] border border-primary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
    >
      CREATE GIG
    </button>
  </div>
);

/* ── Stats strip ──────────────────────────────────────────────────────── */
const StatsStrip = ({
  stats,
}: {
  stats: { label: string; value: string | number; color: string }[];
}) => (
  <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {stats.map((s) => (
      <div
        key={s.label}
        className="rounded-xl border border-border bg-white px-5 py-4"
        style={{ boxShadow: "0 1px 4px rgba(43,155,244,0.05)" }}
      >
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">
          {s.label}
        </span>
        <strong
          className="mt-1.5 block text-2xl font-black"
          style={{ color: s.color }}
        >
          {s.value}
        </strong>
      </div>
    ))}
  </div>
);

/* ── Main page ────────────────────────────────────────────────────────── */
export const DashboardPage = () => {
  const { gigs } = useGigs();
  const { address, isConnected, balance, isFetchingBalance, refreshBalance, openModal } =
    useWallet();
  const [activeTab, setActiveTab] = useState<RoleTab>("all");

  // Not connected — show inline prompt instead of redirecting
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-cloud">
        <section className="page">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
            DASHBOARD&nbsp;// ESCROW
          </p>
          <h1 className="page-title mt-2">Gig Dashboard</h1>
          <p className="page-copy mt-1">
            Track your escrow gigs and milestone progress with on-chain precision.
          </p>

          {/* Tab bar (decorative when disconnected) */}
          <div className="mt-8 flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="flex-none whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition"
                style={
                  tab.id === "all"
                    ? { background: "#2B9BF4", color: "#fff" }
                    : { background: "transparent", color: "#4A5568" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Disconnected panel */}
          <div
            className="mt-3 rounded-2xl border border-border bg-white"
            style={{ boxShadow: "0 2px 12px rgba(43,155,244,0.06)" }}
          >
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-primary-light">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-ink">
                Wallet Disconnected
              </h3>
              <p className="mt-2 max-w-xs text-sm text-body">
                Please connect your wallet using the button in the top right to
                view your dashboard and manage your escrow gigs.
              </p>
              <button
                onClick={openModal}
                className="mt-6 inline-flex items-center gap-2 rounded-[10px] border border-primary px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                CONNECT NOW
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const gigsByRole = {
    all: gigs,
    client: gigs.filter((g) => g.client === address),
    freelancer: gigs.filter((g) => g.freelancer === address),
    arbiter: gigs.filter((g) => g.arbiter === address),
  };

  const visible = gigsByRole[activeTab];

  const disputes = gigs.filter(
    (g) =>
      (g.client === address ||
        g.freelancer === address ||
        g.arbiter === address) &&
      g.milestones.some((m) => m.status === "Disputed")
  ).length;

  const xlmSecured = gigs
    .filter((g) => g.client === address)
    .reduce((sum, g) => sum + g.totalFunded, 0);

  const stats = [
    { label: "Gigs as Client", value: gigsByRole.client.length, color: "#2B9BF4" },
    { label: "Gigs as Freelancer", value: gigsByRole.freelancer.length, color: "#2B9BF4" },
    { label: "XLM Secured", value: xlmSecured.toFixed(2), color: "#22C55E" },
    {
      label: "Active Disputes",
      value: disputes,
      color: disputes > 0 ? "#EF4444" : "#9AA5B4",
    },
  ];

  return (
    <div className="min-h-screen bg-cloud">
      <section className="page">
        {/* Breadcrumb */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
          DASHBOARD&nbsp;// ESCROW
        </p>

        {/* Title + balance row */}
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Gig Dashboard</h1>
            <p className="page-copy mt-1">
              Track your escrow gigs and milestone progress with on-chain
              precision.
            </p>
          </div>

          {/* Balance chip */}
          <div
            className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5"
            style={{ boxShadow: "0 1px 4px rgba(43,155,244,0.05)" }}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Balance
            </span>
            <span className="text-sm font-black text-primary">
              {isFetchingBalance ? "…" : `${balance ?? "—"} XLM`}
            </span>
            <button
              onClick={refreshBalance}
              disabled={isFetchingBalance}
              title="Refresh balance"
              className="ml-1 text-muted transition hover:text-primary disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetchingBalance ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <StatsStrip stats={stats} />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-none whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold tracking-wide transition"
                style={
                  active
                    ? {
                        background: "#2B9BF4",
                        color: "#fff",
                        boxShadow: "0 4px 14px rgba(43,155,244,0.3)",
                      }
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

        {/* Main panel */}
        <div
          className="mt-3 rounded-2xl border border-border bg-white"
          style={{ boxShadow: "0 2px 12px rgba(43,155,244,0.06)" }}
        >
          {visible.length === 0 ? (
            <EmptyState onConnect={openModal} />
          ) : (
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              {visible.map((gig) => (
                <GigCard key={gig.id} gig={gig} address={address} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAB mobile */}
      <Link
        to="/create"
        className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full text-white transition-opacity hover:opacity-90 md:hidden"
        style={{
          background: "#2B9BF4",
          boxShadow: "0 4px 14px rgba(43,155,244,0.4)",
        }}
        aria-label="Create a gig"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
};
