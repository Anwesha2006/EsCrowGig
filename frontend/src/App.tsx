import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { BarChart3, ChevronDown, Copy, ExternalLink, LayoutDashboard, Menu, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { WalletProvider, useWallet } from "./hooks/useWallet";
import { GigsProvider } from "./hooks/useGigs";
import { Button } from "./components/Button";
import { ToastHost } from "./components/ToastHost";
import { OnboardingModal } from "./components/OnboardingModal";
import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateGigPage } from "./pages/CreateGigPage";
import { GigDetailPage } from "./pages/GigDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { StatsPage } from "./pages/StatsPage";

const short = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

const WalletDropdown = ({ onClose }: { onClose: () => void }) => {
  const { address, disconnect } = useWallet();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
    navigate("/");
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-[#E2ECF8] bg-white"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100 }}
    >
      {/* Full address row */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="min-w-0 break-all text-xs text-body">{address}</span>
        <button
          onClick={copy}
          className="flex-none rounded-md p-1.5 text-muted transition hover:bg-primary-light hover:text-primary"
          title="Copy address"
        >
          {copied ? (
            <span className="text-[10px] font-bold text-success">Copied!</span>
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Stellar Expert link */}
      <a
        href={`https://stellar.expert/explorer/testnet/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-body transition hover:bg-primary-light hover:text-primary"
        onClick={onClose}
      >
        <ExternalLink className="h-4 w-4 flex-none" />
        View on Stellar Expert ↗
      </a>

      <div className="mx-4 border-t border-[#E2ECF8]" />

      {/* Disconnect */}
      <button
        onClick={handleDisconnect}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-red-50"
        style={{ color: "#EF4444" }}
      >
        <X className="h-4 w-4 flex-none" />
        Disconnect
      </button>
    </div>
  );
};

const ConnectedPill = () => {
  const { address } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition"
        style={{
          background: "#EBF5FF",
          borderColor: "#2B9BF4",
          borderWidth: "1.5px",
          color: "#2B9BF4",
          cursor: "pointer"
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "#22C55E", flexShrink: 0 }}
        />
        <span>{short(address)}</span>
        <ChevronDown className="h-3.5 w-3.5" style={{ flexShrink: 0 }} />
      </button>
      {open && <WalletDropdown onClose={() => setOpen(false)} />}
    </div>
  );
};

const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-4 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#E2ECF8] bg-white"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100 }}
    >
      {[
        { to: "/dashboard", label: "Dashboard" },
        { to: "/create", label: "Create Gig" },
        { to: "/stats", label: "Stats" }
      ].map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onClose}
          className="block px-4 py-3 text-sm font-semibold text-body transition hover:bg-primary-light hover:text-primary"
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
};

const AppNav = () => {
  const { isConnected, openModal } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-white/95 backdrop-blur">
      <nav className="relative mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-black text-ink"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-light">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <span>
            Escrow<span className="text-primary">Gig</span>
          </span>
        </NavLink>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink className="nav-link" to="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/create">
            <Plus className="h-4 w-4" />
            Create
          </NavLink>
          <NavLink className="nav-link" to="/stats">
            <BarChart3 className="h-4 w-4" />
            Stats
          </NavLink>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <ConnectedPill />
          ) : (
            <button
              onClick={openModal}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-[22px] py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                background: "#2B9BF4",
                boxShadow: "0 4px 14px rgba(43,155,244,0.35)"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1a7fd4";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#2B9BF4";
              }}
            >
              Connect Wallet
            </button>
          )}

          {/* Mobile hamburger */}
          <div className="relative md:hidden">
            <Button
              variant="ghost"
              className="px-3"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {mobileMenuOpen && (
              <MobileMenu onClose={() => setMobileMenuOpen(false)} />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export const App = () => (
  <ToastProvider>
    <WalletProvider>
      <GigsProvider>
        <AppNav />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create" element={<CreateGigPage />} />
            <Route path="/gig/:gigId" element={<GigDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>
        <OnboardingModal />
        <ConnectWalletModal />
        <ToastHost />
      </GigsProvider>
    </WalletProvider>
  </ToastProvider>
);
