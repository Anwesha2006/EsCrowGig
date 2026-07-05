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
  // modal state
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_KEY = "escrowgig_wallet";

const savedAddress = () => localStorage.getItem(STORAGE_KEY) ?? "";

const fetchXLMBalance = async (publicKey: string): Promise<string> => {
  const res = await fetch(
    `https://horizon-testnet.stellar.org/accounts/${publicKey}`
  );
  if (!res.ok) throw new Error("Account not found");
  const data = await res.json();
  const native = (data.balances as Array<{ asset_type: string; balance: string }>).find(
    (b) => b.asset_type === "native"
  );
  if (!native) return "0.00";
  return parseFloat(native.balance).toFixed(2);
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState(savedAddress);
  const [isConnecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [isFetchingBalance, setFetchingBalance] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setFetchingBalance(true);
    try {
      const xlm = await fetchXLMBalance(address);
      setBalance(xlm);
    } catch {
      setBalance("0.00");
    } finally {
      setFetchingBalance(false);
    }
  }, [address]);

  // fetch balance whenever address changes
  useEffect(() => {
    if (address) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [address, refreshBalance]);

  const handleConnected = useCallback((addr: string) => {
    setAddress(addr);
    localStorage.setItem(STORAGE_KEY, addr);
    analytics.walletConnected(addr);
  }, []);

  const connect = useCallback(async () => {
    // connect is now opened via the modal — this is kept for backward compat
    setModalOpen(true);
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const connectWithWallet = useCallback(
    async (walletId: string): Promise<void> => {
      setConnecting(true);
      try {
        const { StellarWalletsKit, WalletNetwork } = await import(
          "@creit.tech/stellar-wallets-kit"
        );
        const kit = new StellarWalletsKit({
          network: WalletNetwork.TESTNET,
          selectedWalletId: walletId,
          modules: (await import("@creit.tech/stellar-wallets-kit")).allowAllModules()
        });
        kit.setWallet(walletId);
        const result = await kit.getAddress();
        handleConnected(result.address);
        setModalOpen(false);
      } finally {
        setConnecting(false);
      }
    },
    [handleConnected]
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
      // expose connectWithWallet via context for the modal
      _connectWithWallet: connectWithWallet
    } as WalletContextValue & { _connectWithWallet: (id: string) => Promise<void> }),
    [
      address,
      isConnecting,
      balance,
      isFetchingBalance,
      connect,
      disconnect,
      refreshBalance,
      isModalOpen,
      openModal,
      closeModal,
      connectWithWallet
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context as WalletContextValue & { _connectWithWallet: (id: string) => Promise<void> };
};
