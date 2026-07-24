import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, ExternalLink, Loader2, AlertTriangle, RefreshCw, LockKeyhole } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

type WalletOption = { id: string; name: string; icon: string; installUrl: string; windowKey: string };
const wallets: WalletOption[] = [
  { id: "freighter", name: "Freighter", icon: "🛡️", installUrl: "https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk", windowKey: "freighter" },
  { id: "xbull@1", name: "xBull", icon: "🐂", installUrl: "https://xbull.app/", windowKey: "xBullSDK" },
  { id: "albedo@1", name: "Albedo", icon: "🌅", installUrl: "https://albedo.link/", windowKey: "albedo" },
  { id: "lobstr@1", name: "LOBSTR", icon: "🦞", installUrl: "https://lobstr.co/", windowKey: "lobstr" },
];

const checkWindow = (key: string) => typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>)[key];
const checkFreighter = () => { if (typeof window === "undefined") return false; const walletWindow = window as any; return !!(walletWindow.freighter || walletWindow.freighterApi || walletWindow.stellar?.freighter); };
const message = (error: unknown) => error instanceof Error ? error.message : "Wallet connection failed. Please try again.";

export const ConnectWalletModal = () => {
  const { isModalOpen, closeModal, isConnecting, freighterDetected, _connectWithWallet } = useWallet();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<Record<string, boolean>>({});
  const [detecting, setDetecting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const detect = async () => {
    const result: Record<string, boolean> = {};
    wallets.forEach((wallet) => { result[wallet.windowKey] = wallet.windowKey === "freighter" ? checkFreighter() : checkWindow(wallet.windowKey); });
    if (!result.freighter) { try { const { isConnected } = await import("@stellar/freighter-api"); result.freighter = !!(await isConnected()).isConnected; } catch { /* extension unavailable */ } }
    setDetected(result); setDetecting(false); return result;
  };

  useEffect(() => {
    if (!isModalOpen) return;
    setDetecting(true); setError(null);
    const timeout = setTimeout(detect, 500);
    return () => clearTimeout(timeout);
  }, [isModalOpen]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") closeModal(); }; document.addEventListener("keydown", handler); return () => document.removeEventListener("keydown", handler); }, [closeModal]);
  useEffect(() => { document.body.style.overflow = isModalOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [isModalOpen]);
  if (!isModalOpen) return null;

  const available = (wallet: WalletOption) => wallet.windowKey === "freighter" ? freighterDetected || !!detected.freighter || checkFreighter() : detected[wallet.windowKey] ?? checkWindow(wallet.windowKey);
  const connect = async (wallet: WalletOption) => {
    if (!available(wallet)) { setError(`not-installed:${wallet.name}:${wallet.installUrl}`); return; }
    setError(null); setConnectingWallet(wallet.name);
    try { await _connectWithWallet(wallet.id); }
    catch (err) { const errorMessage = message(err); setError(errorMessage.toLowerCase().match(/rejected|denied|cancel/) ? "Connection rejected. Please try again." : errorMessage); }
    finally { setConnectingWallet(null); }
  };
  const install = error?.startsWith("not-installed:") ? error.split(":") : null;
  const installName = install?.[1]; const installUrl = install?.slice(2).join(":");

  return <div ref={overlayRef} onClick={(event) => { if (event.target === overlayRef.current) closeModal(); }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(4,5,4,.78)", backdropFilter: "blur(8px)" }} role="dialog" aria-modal="true" aria-label="Connect Wallet">
    <div className="animate-scale-in relative w-full max-w-[420px] overflow-hidden rounded-[20px] border border-white/10 bg-[#151816] p-6 shadow-[0_24px_80px_rgba(0,0,0,.55)] sm:p-8">
      <button onClick={closeModal} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[#8d9289] transition hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d7f52b]/10 px-3.5 py-1 text-xs font-bold text-[#d7f52b]"><LockKeyhole className="h-3 w-3" /> SECURE CONNECTION</span>
        <h2 className="mt-3 text-[28px] font-medium tracking-[-.04em] text-[#f7f7f3]">Connect your wallet</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-[#aeb3aa]">Choose a Stellar wallet to connect. Your funds remain in your control at all times.</p>
      </div>
      <div className="mt-6">
        {connectingWallet || detecting ? <div className="flex flex-col items-center gap-3 py-8"><Loader2 className="h-8 w-8 animate-spin text-[#d7f52b]" /><p className="text-sm text-[#b9bdb5]">{connectingWallet ? `Connecting to ${connectingWallet}...` : "Detecting wallets..."}</p>{connectingWallet && <button onClick={() => setConnectingWallet(null)} className="text-xs text-[#858b82] underline hover:text-white">Cancel</button>}</div> : <>
          {error && <div className="mb-4 rounded-[10px] border border-[#ff8585]/50 bg-[#ff6363]/10 px-4 py-3 text-sm text-[#ffb0b0]">{installName ? <div className="flex flex-col gap-2"><p className="flex gap-2"><AlertTriangle className="mt-.5 h-4 w-4 flex-none" /><span><b>{installName}</b> was not detected. <a href={installUrl} target="_blank" rel="noreferrer" className="font-bold underline">Install it ↗</a>, then retry.</span></p><button onClick={() => { setDetecting(true); setError(null); setTimeout(detect, 500); }} className="flex items-center gap-1.5 self-start rounded-lg border border-[#ff8585]/60 px-3 py-1.5 text-xs font-bold hover:bg-white/10"><RefreshCw className="h-3 w-3" /> Retry detection</button></div> : <p className="flex gap-2"><AlertTriangle className="h-4 w-4 flex-none" />{error}</p>}</div>}
          <div className="grid gap-3">{wallets.map((wallet) => { const isAvailable = available(wallet); return <button key={wallet.id} onClick={() => connect(wallet)} disabled={isConnecting} className="group flex w-full items-center gap-3.5 rounded-xl border border-white/10 bg-[#1b1f1c] px-4 py-3.5 text-left transition hover:border-[#d7f52b]/80 hover:bg-[#222721] disabled:cursor-not-allowed"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-xl">{wallet.icon}</span><span className="flex-1 font-bold" style={{ color: isAvailable ? "#f1f2ee" : "#737970" }}>{wallet.name}</span>{isAvailable ? <ArrowRight className="h-4 w-4 text-[#d7f52b] opacity-60 transition group-hover:opacity-100" /> : <span className="flex items-center gap-1 text-xs font-semibold text-[#858b82]">Not detected <ExternalLink className="h-3 w-3" /></span>}</button>; })}</div>
        </>}
      </div>
      <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-[#858b82]">New to Stellar wallets? <a href="https://developers.stellar.org/docs/learn/wallets" target="_blank" rel="noreferrer" className="font-semibold text-[#d7f52b] hover:underline">Learn how to set up →</a></div>
    </div>
  </div>;
};
