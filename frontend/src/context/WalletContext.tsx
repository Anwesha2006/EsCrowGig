import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { analytics } from "../lib/analytics";

export type WalletContextValue = {
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
  isFetchingBalance: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  freighterDetected: boolean;
};

export const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_KEY = "escrowgig_wallet";
const WALLET_REQUEST_TIMEOUT_MS = 10_000;
const savedAddress = () => localStorage.getItem(STORAGE_KEY) ?? "";

import { isConnected, requestAccess } from '@stellar/freighter-api';

const walletErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof value.message === "string") return value.message;
    if (typeof value.error?.message === "string") return value.error.message;
  }
  return "Wallet connection failed. Please try again.";
};

const withWalletTimeout = async <T,>(request: Promise<T>): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Freighter did not respond. Unlock or reload the extension, then try again.")),
      WALLET_REQUEST_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/** Check all known Freighter injection points */
const detectFreighter = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  const w = window as any;
if (w.freighter || w.freighterApi || (w.stellar && w.stellar.freighter)) {
    return true;
}
  try {
   const result = await isConnected();
   if (result.isConnected) return true;
  } catch (e) {
    // ignore
  }
  return false;
};

const fetchXLMBalance = async (publicKey: string): Promise<string> => {
  const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
  if (!res.ok) throw new Error("Account not found");
  const data = await res.json();
  const native = (data.balances as Array<{ asset_type: string; balance: string }>).find(
    (b) => b.asset_type === "native"
  );
  return native ? parseFloat(native.balance).toFixed(2) : "0.00";
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState(savedAddress);
  const [isConnecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isFetchingBalance, setFetchingBalance] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [freighterDetected, setFreighterDetected] = useState(false);

  // Poll for Freighter injection — extensions inject asynchronously after page load.
  // Start after 800ms so the extension has time to inject before first check.
  useEffect(() => {
    let tries = 0;
    const check = async () => {
      if (await detectFreighter()) {
        setFreighterDetected(true);
        return;
      }
      if (++tries < 12) setTimeout(check, 300); // poll up to ~4s total
    };
    // 800ms initial delay before first detection attempt
    const initial = setTimeout(check, 800);
    return () => clearTimeout(initial);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setFetchingBalance(true);
    try {
      setBalance(await fetchXLMBalance(address));
    } catch {
      setBalance("0.00");
    } finally {
      setFetchingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) refreshBalance();
    else setBalance(null);
  }, [address, refreshBalance]);

  const handleConnected = useCallback((addr: string) => {
    setAddress(addr);
    localStorage.setItem(STORAGE_KEY, addr);
    analytics.walletConnected(addr);
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const connect = useCallback(async () => setModalOpen(true), []);

  /**
   * Connect via Freighter using the Kit's FreighterModule.
   * Calling kit.getAddress() with skipRequestAccess:false triggers
   * the Freighter extension popup for account selection.
   */
  const connectWithWallet = useCallback(
    async (walletId: string): Promise<void> => {
      setConnecting(true);
      try {
        let addr = "";

        if (walletId === "freighter") {
          const result = await withWalletTimeout(requestAccess());
          if (result.error) throw new Error(walletErrorMessage(result.error));
          addr = result.address;
        }

        if (!addr) {
          const {
            StellarWalletsKit,
            WalletNetwork,
            FREIGHTER_ID,
            FreighterModule,
            xBullModule,
            AlbedoModule,
            LobstrModule,
          } = await import("@creit.tech/stellar-wallets-kit");

          const modules = [
            new FreighterModule(),
            new xBullModule(),
            new AlbedoModule(),
            new LobstrModule(),
          ];

          const kit = new StellarWalletsKit({
            network: WalletNetwork.TESTNET,
            selectedWalletId: walletId,
            modules,
          });

          kit.setWallet(walletId);

          // skipRequestAccess: false → triggers the Freighter account-selection popup
          const result = await kit.getAddress({ skipRequestAccess: false });
          addr = result.address;
        }

        if (!addr) throw new Error("No address returned. Please try again.");
        handleConnected(addr);
        setModalOpen(false);
      } finally {
        setConnecting(false);
      }
    },
    [handleConnected, setModalOpen]
  );

  const disconnect = useCallback(() => {
    analytics.walletDisconnected(address);
    setAddress("");
    setBalance(null);
    localStorage.removeItem(STORAGE_KEY);
  }, [address]);

  const value = useMemo(
    () => ({
      address,
      isConnected: !!address,
      isConnecting,
      balance,
      isFetchingBalance,
      connect,
      disconnect,
      refreshBalance,
      isModalOpen,
      openModal,
      closeModal,
      freighterDetected,
      _connectWithWallet: connectWithWallet,
    } as WalletContextValue & { _connectWithWallet: (id: string) => Promise<void> }),
    [
      address, isConnecting, balance, isFetchingBalance,
      connect, disconnect, refreshBalance,
      isModalOpen, openModal, closeModal,
      freighterDetected, connectWithWallet,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx as WalletContextValue & { _connectWithWallet: (id: string) => Promise<void> };
};
