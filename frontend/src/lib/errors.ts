export const explainError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (/User declined|rejected|denied/i.test(message)) {
    return "The wallet request was cancelled. Try again when you are ready.";
  }
  if (/insufficient|underfunded/i.test(message)) {
    return "That wallet does not have enough testnet XLM for this action.";
  }
  if (/network|fetch|timeout/i.test(message)) {
    return "The Stellar testnet did not respond. Check your connection and retry.";
  }
  if (/not found|contract/i.test(message)) {
    return "The escrow contract could not be reached. Confirm your contract ID in .env.";
  }

  return "Something went wrong while sending the transaction. Please review the details and retry.";
};

