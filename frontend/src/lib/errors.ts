export const explainError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (/User declined|rejected|denied|user reject/i.test(message)) {
    return "Wallet request cancelled. Try again when ready.";
  }
  if (/insufficient|underfunded/i.test(message)) {
    return "Not enough testnet XLM. Fund your wallet at laboratory.stellar.org/friendbot";
  }
  if (/network|fetch|ECONNREFUSED/i.test(message)) {
    return "Stellar testnet did not respond. Check your connection and retry.";
  }
  if (/not found|contract/i.test(message)) {
    return "Escrow contract could not be reached. Check VITE_CONTRACT_ID in .env";
  }
  if (/allowance|approve|token/i.test(message)) {
    return "Token allowance error. Your wallet needs to approve the contract to spend XLM.";
  }
  if (/Simulation failed/i.test(message)) {
    return message; // show the real simulation error
  }
  if (/Transaction failed/i.test(message)) {
    return message; // show the real on-chain error
  }

  // Always show the raw message so it's debuggable
  return message || "Something went wrong. Open the browser console for details.";
};

