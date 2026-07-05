import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { track } from "../lib/analytics";

type WalletContextValue = {
  address: string;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const savedAddress = () => localStorage.getItem("escrowgig:wallet") ?? "";

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState(savedAddress);
  const [isConnecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { allowAllModules, FREIGHTER_ID, StellarWalletsKit, WalletNetwork } = await import(
        "@creit.tech/stellar-wallets-kit"
      );
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        modules: allowAllModules()
      });

      await new Promise<void>((resolve, reject) => {
        kit.openModal({
          onWalletSelected: async (option) => {
            try {
              kit.setWallet(option.id);
              const result = await kit.getAddress();
              setAddress(result.address);
              localStorage.setItem("escrowgig:wallet", result.address);
              track("wallet_connected", { wallet: result.address });
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        });
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress("");
    localStorage.removeItem("escrowgig:wallet");
  }, []);

  const value = useMemo(
    () => ({ address, isConnecting, connect, disconnect }),
    [address, isConnecting, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
