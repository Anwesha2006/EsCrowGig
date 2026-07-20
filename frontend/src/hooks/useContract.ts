import { useCallback, useState } from "react";
import {
  approveMilestone as approveMilestoneCall,
  createGig as createGigCall,
  fundGig as fundGigCall,
  getGig as getGigCall,
  raiseDispute as raiseDisputeCall,
  resolveDispute as resolveDisputeCall,
  submitMilestone as submitMilestoneCall,
} from "../lib/stellar";

/** Provides contract calls with a consistent loading and error lifecycle. */
export const useContract = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Contract request failed";
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createGig: (...args: Parameters<typeof createGigCall>) => run(() => createGigCall(...args)),
    fundGig: (...args: Parameters<typeof fundGigCall>) => run(() => fundGigCall(...args)),
    submitMilestone: (...args: Parameters<typeof submitMilestoneCall>) => run(() => submitMilestoneCall(...args)),
    approveMilestone: (...args: Parameters<typeof approveMilestoneCall>) => run(() => approveMilestoneCall(...args)),
    raiseDispute: (...args: Parameters<typeof raiseDisputeCall>) => run(() => raiseDisputeCall(...args)),
    resolveDispute: (...args: Parameters<typeof resolveDisputeCall>) => run(() => resolveDisputeCall(...args)),
    getGig: (...args: Parameters<typeof getGigCall>) => run(() => getGigCall(...args)),
    isLoading,
    error,
  };
};
