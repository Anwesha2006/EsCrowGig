import { NavLink, Route, Routes } from "react-router-dom";
import { BarChart3, LayoutDashboard, Plus, ShieldCheck, Wallet } from "lucide-react";
import { ToastProvider } from "./hooks/useToast";
import { WalletProvider, useWallet } from "./hooks/useWallet";
import { GigsProvider } from "./hooks/useGigs";
import { Button } from "./components/Button";
import { ToastHost } from "./components/ToastHost";
import { OnboardingModal } from "./components/OnboardingModal";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreateGigPage } from "./pages/CreateGigPage";
import { GigDetailPage } from "./pages/GigDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { StatsPage } from "./pages/StatsPage";
import { explainError } from "./lib/errors";

const AppNav = () => {
  const { address, connect, disconnect, isConnecting } = useWallet();

  const connectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      alert(explainError(error));
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-cloud/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-black text-ink">
          <ShieldCheck className="h-6 w-6 text-moss" />
          EscrowGig
        </NavLink>
        <div className="flex flex-wrap items-center gap-1">
          <NavLink className="nav-link" to="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
          <NavLink className="nav-link" to="/create"><Plus className="h-4 w-4" />Create</NavLink>
          <NavLink className="nav-link" to="/stats"><BarChart3 className="h-4 w-4" />Stats</NavLink>
        </div>
        {address ? (
          <Button variant="secondary" onClick={disconnect} icon={<Wallet className="h-4 w-4" />}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </Button>
        ) : (
          <Button isLoading={isConnecting} onClick={connectWallet} icon={<Wallet className="h-4 w-4" />}>
            Connect wallet
          </Button>
        )}
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
        <ToastHost />
      </GigsProvider>
    </WalletProvider>
  </ToastProvider>
);

