import { useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  BarChart3, ChevronDown, Copy, ExternalLink,
  LayoutDashboard, Menu, Plus, ShieldCheck, X
} from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { WalletProvider, useWallet } from "./hooks/useWallet";
import { GigsProvider } from "./hooks/useGigs";
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

/* ── Wallet dropdown ──────────────────────────────────────────────────── */
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
      className="absolute right-0 top-full mt-2 w-[min(18rem,90vw)] overflow-hidden rounded-xl border border-border bg-white"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100 }}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="min-w-0 break-all text-xs text-body">{address}</span>
        <button
          onClick={copy}
          className="flex-none rounded-md p-1.5 text-muted transition hover:bg-primary-light hover:text-primary"
          title="Copy address"
        >
          {copied
            ? <span className="text-[10px] font-bold text-success">Copied!</span>
            : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
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
      <div className="mx-4 border-t border-border" />
      <button
        onClick={handleDisconnect}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-red-50"
      >
        <X className="h-4 w-4 flex-none" />
        Disconnect
      </button>
    </div>
  );
};

/* ── Connected pill ───────────────────────────────────────────────────── */
const ConnectedPill = () => {
  const { address } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border-[1.5px] border-primary bg-primary-light px-3 py-1.5 text-sm font-medium text-primary transition sm:gap-2 sm:px-4 sm:py-2"
      >
        <span className="h-2 w-2 flex-none rounded-full bg-success" />
        <span className="hidden xs:inline">{short(address)}</span>
        <ChevronDown className="h-3.5 w-3.5 flex-none" />
      </button>
      {open && <WalletDropdown onClose={() => setOpen(false)} />}
    </div>
  );
};

/* ── Mobile slide-down menu ───────────────────────────────────────────── */
const MobileMenu = ({ onClose }: { onClose: () => void }) => {
  const { isConnected, openModal } = useWallet();
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
      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 100 }}
    >
      {[
        { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
        { to: "/create", label: "Create Gig", Icon: Plus },
        { to: "/stats", label: "Stats", Icon: BarChart3 },
      ].map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition ${
              isActive ? "bg-primary-light text-primary" : "text-body hover:bg-primary-light hover:text-primary"
            }`
          }
        >
          <Icon className="h-4 w-4 flex-none" />
          {label}
        </NavLink>
      ))}
      {!isConnected && (
        <>
          <div className="mx-4 border-t border-border" />
          <button
            onClick={() => { openModal(); onClose(); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light"
          >
            Connect Wallet
          </button>
        </>
      )}
    </div>
  );
};

/* ── Navbar ───────────────────────────────────────────────────────────── */
const AppNav = () => {
  const { isConnected, openModal } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-white/95 backdrop-blur sm:h-16">
      <nav className="relative mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 text-base font-black text-ink sm:text-lg">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-light sm:h-9 sm:w-9">
            <ShieldCheck className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          </span>
          <span>Escrow<span className="text-primary">Gig</span></span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink className="nav-link" to="/dashboard">
            <LayoutDashboard className="h-4 w-4" />Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/create">
            <Plus className="h-4 w-4" />Create
          </NavLink>
          <NavLink className="nav-link" to="/stats">
            <BarChart3 className="h-4 w-4" />Stats
          </NavLink>
        </div>

        {/* Right: wallet + hamburger */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <ConnectedPill />
          ) : (
            <button
              onClick={openModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-white transition active:opacity-80 sm:h-11 sm:px-[22px]"
              style={{ background: "#2B9BF4", boxShadow: "0 4px 14px rgba(43,155,244,0.35)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1a7fd4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#2B9BF4"; }}
            >
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}

          {/* Hamburger — mobile only */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-lg text-body transition hover:bg-primary-light hover:text-primary"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}
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
