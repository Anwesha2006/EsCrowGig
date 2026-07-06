import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, ExternalLink, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

type WalletOption = {
  id: string;
  name: string;
  icon: string;
  installUrl: string;
  windowKey: string;
};

const wallets: WalletOption[] = [
  {
    id: "freighter",   // matches FREIGHTER_ID from the kit
    name: "Freighter",
    icon: "🛡️",
    installUrl:
      "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk",
    windowKey: "freighter",
  },
  {
    id: "xbull@1",
    name: "xBull",
    icon: "🐂",
    installUrl: "https://xbull.app/",
    windowKey: "xBullSDK",
  },
  {
    id: "albedo@1",
    name: "Albedo",
    icon: "🌅",
    installUrl: "https://albedo.link/",
    windowKey: "albedo",
  },
  {
    id: "lobstr@1",
    name: "LOBSTR",
    icon: "🦞",
    installUrl: "https://lobstr.co/",
    windowKey: "lobstr",
  },
];

const checkWindow = (key: string) =>
  typeof window !== "undefined" &&
  !!(window as unknown as Record<string, unknown>)[key];

const checkFreighter = (): boolean => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.freighter || w.freighterApi || (w.stellar && w.stellar.freighter));
};

export const ConnectWalletModal = () => {
  const { isModalOpen, closeModal, isConnecting, freighterDetected, _connectWithWallet } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<Record<string, boolean>>({});
  // true while we're still waiting for the initial 800ms detection pass
  const [detecting, setDetecting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // On open: show spinner for 800ms then do a full detection sweep
  useEffect(() => {
    if (!isModalOpen) return;

    setDetecting(true);
    setError(null);

    const runDetection = async () => {
      const result: Record<string, boolean> = {};
      wallets.forEach((w) => {
        result[w.windowKey] = w.windowKey === "freighter"
          ? checkFreighter()
          : checkWindow(w.windowKey);
      });
      
      if (!result["freighter"]) {
        try {
          const { isConnected } = await import("@stellar/freighter-api");
          if (await isConnected()) result["freighter"] = true;
        } catch (e) {
          // ignore
        }
      }

      setDetected(result);
      setDetecting(false);
    };

    // 800ms delay — give extension time to inject
    const t0 = setTimeout(runDetection, 800);
    // Follow-up sweeps in case injection is slower
    const t1 = setTimeout(runDetection, 1500);
    const t2 = setTimeout(runDetection, 3000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [isModalOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeModal]);

  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isModalOpen]);

  // Clear error if Freighter is detected asynchronously
  useEffect(() => {
    if (freighterDetected && error?.startsWith("not-installed:Freighter")) {
      setError(null);
    }
  }, [freighterDetected, error]);

  if (!isModalOpen) return null;

  const isAvailable = (w: WalletOption) => {
    if (w.windowKey === "freighter") return freighterDetected || !!detected["freighter"] || checkFreighter();
    return detected[w.windowKey] ?? checkWindow(w.windowKey);
  };

  const handleConnect = async (wallet: WalletOption) => {
    if (!isAvailable(wallet)) {
      setError(`not-installed:${wallet.name}:${wallet.installUrl}`);
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



  // Retry: show spinner for 1s then re-check
  const recheck = () => {
    const currentError = error;
    setDetecting(true);
    setError(null);
    setTimeout(async () => {
      const result: Record<string, boolean> = {};
      wallets.forEach((w) => {
        result[w.windowKey] = w.windowKey === "freighter"
          ? checkFreighter()
          : checkWindow(w.windowKey);
      });
      
      // Do async check for Freighter if needed
      if (!result["freighter"]) {
        try {
          const { isConnected } = await import("@stellar/freighter-api");
          if (await isConnected()) result["freighter"] = true;
        } catch (e) {
          // ignore
        }
      }

      setDetected(result);
      setDetecting(false);

      if (currentError?.startsWith("not-installed:")) {
        const match = currentError.split(":");
        const name = match[1];
        const w = wallets.find((x) => x.name === name);
        if (w) {
          const isAvail = w.windowKey === "freighter" ? result["freighter"] : result[w.windowKey];
          if (!isAvail) setError(currentError);
        }
      }
    }, 1000);
  };

  const notInstalledMatch = error?.startsWith("not-installed:") ? error.split(":") : null;
  const notInstalledName = notInstalledMatch?.[1];
  const notInstalledUrl = notInstalledMatch?.slice(2).join(":");

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) closeModal(); }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      <div
        className="animate-scale-in relative w-[90vw] max-w-[420px] overflow-hidden rounded-[20px] bg-white p-8"
        style={{ boxShadow: "0 20px 60px rgba(43,155,244,0.15)" }}
      >
        {/* Close */}
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

        {/* Body */}
        <div className="mt-6">
          {connectingWallet ? (
            /* Connecting spinner */
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-body">Connecting to {connectingWallet}...</p>
              <button onClick={() => setConnectingWallet(null)} className="text-xs text-muted underline hover:text-body">
                Cancel
              </button>
            </div>
          ) : detecting ? (
            /* Detection spinner — shown for the initial 800ms */
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted">Detecting Freighter...</p>
            </div>
          ) : (
            <>
              {/* Error / not-installed alert */}
              {error && (
                <div
                  className="mb-4 rounded-[10px] border px-4 py-3 text-sm"
                  style={{ background: "#FEE2E2", borderColor: "#EF4444", color: "#DC2626" }}
                >
                  {notInstalledName ? (
                    <div className="flex flex-col gap-2">
                      <p className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                        <span>
                          <strong>{notInstalledName}</strong> extension not detected.{" "}
                          <a href={notInstalledUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">
                            Install it ↗
                          </a>
                          , then click Retry.
                        </span>
                      </p>
                      <button
                        onClick={recheck}
                        className="flex items-center gap-1.5 self-start rounded-lg border border-[#EF4444] px-3 py-1.5 text-xs font-bold transition hover:bg-red-50"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry detection
                      </button>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 flex-none" />
                      {error}
                    </p>
                  )}
                </div>
              )}

              {/* Wallet list */}
              <div className="grid gap-3">
                {wallets.map((wallet) => {
                  const available = isAvailable(wallet);
                  return (
                    <button
                      key={wallet.id}
                      onClick={() => handleConnect(wallet)}
                      disabled={isConnecting}
                      className="group flex w-full items-center gap-3.5 rounded-xl border border-[#E2ECF8] bg-white px-4 py-3.5 text-left transition-all duration-150 hover:border-primary hover:bg-[#EBF5FF] disabled:cursor-not-allowed"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary-light text-xl">
                        {wallet.icon}
                      </span>
                      <span className="flex-1 font-bold" style={{ color: available ? "#0D0D0D" : "#9AA5B4" }}>
                        {wallet.name}
                      </span>
                      {available ? (
                        <ArrowRight className="h-4 w-4 flex-none text-primary opacity-60 transition group-hover:opacity-100" />
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                          Not detected <ExternalLink className="h-3 w-3" />
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
