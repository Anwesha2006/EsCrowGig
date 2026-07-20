import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";
export { WalletProvider } from "../context/WalletContext";

/** A compact wallet API for pages and contract-facing components. */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");

  return {
    ...context,
    _connectWithWallet: (context as typeof context & {
      _connectWithWallet: (walletId: string) => Promise<void>;
    })._connectWithWallet,
    publicKey: context.address || null,
    balance: context.balance ?? "0.00",
  };
};
