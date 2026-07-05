import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

type WalletOption = {
  id: string;
  name: string;
  icon: string;
  installUrl: string;
  isAvailable: () => boolean;
};

const wallets: WalletOption[] = [
  {
    id: "freighter@1",
    name: "Freighter",
    icon: "🛡️",
    installUrl: "https://www.freighter.app/",
    isAvailable: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).freighter
  },
  {
    id: "xbull@1",
    name: "xBull",
    icon: "🐂",
    installUrl: "https://xbull.app/",
    isAvailable: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).xBullSDK
  },
  {
    id: "albedo@1",
    name: "Albedo",
    icon: "🌅",
    installUrl: "https://albedo.link/",
    isAvailable: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).albedo
  },
  {
    id: "lobstr@1",
    name: "LOBSTR",
    icon: "🦞",
    installUrl: "https://lobstr.co/",
    isAvailable: () =>
      typeof window !== "undefined" &&
      !!(window as unknown as Record<string, unknown>).lobstr
  }
];

export const ConnectWalletModal = () => {
  const { isModalOpen, closeModal, isConnecting, _connectWithWallet } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  // lock body scroll while open
  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const handleConnect = async (wallet: WalletOption) => {
    if (!wallet.isAvailable()) {
      window.open(wallet.installUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setError(null);
    setConnectingWallet(wallet.name);
    try {
      await _connectWithWallet(wallet.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancel")) {
        setError("Connection rejected. Please try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeModal();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      <div
        className="relative w-[90vw] max-w-[420px] overflow-hidden rounded-b-[20px] rounded-t-[20px] bg-white p-8"
        style={{ boxShadow: "0 20px 60px rgba(43,155,244,0.15)" }}
      >
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-red-50 hover:text-danger"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold"
            style={{ background: "#EBF5FF", color: "#2B9BF4" }}
          >
            🔒 Secure Connection
          </span>
          <h2 className="mt-3 text-[22px] font-extrabold text-ink">Connect Your Wallet</h2>
          <p className="mt-2 max-w-xs text-sm text-body">
            Choose a wallet to connect to EscrowGig. Your funds stay in your control at all times.
          </p>
        </div>

        {/* Content */}
        <div className="mt-6">
          {connectingWallet ? (
            /* Loading state */
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-body">Connecting to {connectingWallet}...</p>
              <button
                onClick={() => setConnectingWallet(null)}
                className="text-xs text-muted underline hover:text-body"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Error state */}
              {error && (
                <div
                  className="mb-4 flex items-center gap-2 rounded-[10px] border px-4 py-3 text-sm"
                  style={{
                    background: "#FEE2E2",
                    borderColor: "#EF4444",
                    color: "#DC2626"
                  }}
                >
                  <AlertTriangle className="h-4 w-4 flex-none" />
                  <span>{error}</span>
                </div>
              )}

              {/* Wallet list */}
              <div className="grid gap-3">
                {wallets.map((wallet) => {
                  const available = wallet.isAvailable();
                  return (
                    <button
                      key={wallet.id}
                      onClick={() => handleConnect(wallet)}
                      disabled={isConnecting}
                      className="group flex w-full items-center gap-3.5 rounded-xl border border-[#E2ECF8] bg-white px-4 py-3.5 text-left transition-all duration-150 hover:border-primary hover:bg-[#EBF5FF] disabled:cursor-not-allowed"
                      style={{ opacity: available ? 1 : 0.5 }}
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-light text-xl">
                        {wallet.icon}
                      </span>
                      <span className="flex-1 font-bold text-ink">{wallet.name}</span>
                      {available ? (
                        <ArrowRight className="h-4 w-4 flex-none text-primary opacity-60 transition group-hover:opacity-100" />
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                          Install <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-[#E2ECF8] pt-4 text-center text-xs text-muted">
          New to Stellar wallets?{" "}
          <a
            href="https://developers.stellar.org/docs/learn/wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Learn how to set up →
          </a>
        </div>
      </div>
    </div>
  );
};
