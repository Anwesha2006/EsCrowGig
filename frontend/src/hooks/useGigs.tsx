import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FeedbackEntry, Gig, MilestoneStatus, TxReceipt } from "../types";
import { track } from "../lib/analytics";
import { addFeedback, loadFeedback, loadGigs, upsertGig } from "../lib/storage";
import { buildGigPayload, submitContractAction } from "../lib/stellar";

type CreateGigInput = {
  client: string;
  freelancer: string;
  arbiter: string;
  milestones: { description: string; amount: number }[];
};

type GigsContextValue = {
  gigs: Gig[];
  feedback: FeedbackEntry[];
  refresh: () => void;
  createGig: (input: CreateGigInput) => Promise<TxReceipt>;
  submitMilestone: (gigId: string, milestoneId: number, proof: string) => Promise<TxReceipt>;
  approveMilestone: (gigId: string, milestoneId: number) => Promise<TxReceipt>;
  raiseDispute: (gigId: string, milestoneId: number) => Promise<TxReceipt>;
  resolveDispute: (gigId: string, milestoneId: number, releaseTo: string) => Promise<TxReceipt>;
  cancelGig: (gigId: string) => Promise<TxReceipt>;
  submitFeedback: (entry: Omit<FeedbackEntry, "id" | "createdAt">) => FeedbackEntry;
};

const GigsContext = createContext<GigsContextValue | undefined>(undefined);

const setMilestone = (gig: Gig, milestoneId: number, status: MilestoneStatus, proof?: string): Gig => ({
  ...gig,
  milestones: gig.milestones.map((milestone) =>
    milestone.id === milestoneId
      ? { ...milestone, status, proof: proof ?? milestone.proof }
      : milestone
  )
});

export const GigsProvider = ({ children }: { children: ReactNode }) => {
  const [gigs, setGigs] = useState<Gig[]>(loadGigs);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(loadFeedback);

  const refresh = useCallback(() => {
    setGigs(loadGigs());
    setFeedback(loadFeedback());
  }, []);

  const persistGig = useCallback((gig: Gig) => {
    const saved = upsertGig(gig);
    setGigs(loadGigs());
    return saved;
  }, []);

  const createGig = useCallback(
    async (input: CreateGigInput) => {
      const receipt = await submitContractAction("create_gig + fund_gig");
      const gig = buildGigPayload(input.client, input.freelancer, input.arbiter, input.milestones);
      persistGig({ ...gig, lastTxHash: receipt.hash });
      track("gig_created", { gigId: gig.id, totalFunded: gig.totalFunded });
      return receipt;
    },
    [persistGig]
  );

  const submitMilestone = useCallback(
    async (gigId: string, milestoneId: number, proof: string) => {
      const receipt = await submitContractAction("submit_milestone");
      const gig = loadGigs().find((item) => item.id === gigId);
      if (gig) {
        persistGig({ ...setMilestone(gig, milestoneId, "Submitted", proof), lastTxHash: receipt.hash });
      }
      track("milestone_submitted", { gigId, milestoneId });
      return receipt;
    },
    [persistGig]
  );

  const approveMilestone = useCallback(
    async (gigId: string, milestoneId: number) => {
      const receipt = await submitContractAction("approve_milestone");
      const gig = loadGigs().find((item) => item.id === gigId);
      if (gig) {
        persistGig({ ...setMilestone(gig, milestoneId, "Approved"), lastTxHash: receipt.hash });
      }
      track("milestone_approved", { gigId, milestoneId });
      return receipt;
    },
    [persistGig]
  );

  const raiseDispute = useCallback(
    async (gigId: string, milestoneId: number) => {
      const receipt = await submitContractAction("raise_dispute_as");
      const gig = loadGigs().find((item) => item.id === gigId);
      if (gig) {
        persistGig({ ...setMilestone(gig, milestoneId, "Disputed"), lastTxHash: receipt.hash });
      }
      track("dispute_raised", { gigId, milestoneId });
      return receipt;
    },
    [persistGig]
  );

  const resolveDispute = useCallback(
    async (gigId: string, milestoneId: number, releaseTo: string) => {
      const receipt = await submitContractAction("resolve_dispute");
      const gig = loadGigs().find((item) => item.id === gigId);
      if (gig) {
        persistGig({ ...setMilestone(gig, milestoneId, "Approved"), lastTxHash: receipt.hash });
      }
      return { ...receipt, action: `resolve_dispute to ${releaseTo.slice(0, 8)}...` };
    },
    [persistGig]
  );

  const cancelGig = useCallback(
    async (gigId: string) => {
      const receipt = await submitContractAction("cancel_gig");
      const gig = loadGigs().find((item) => item.id === gigId);
      if (gig) {
        persistGig({ ...gig, isActive: false, lastTxHash: receipt.hash });
      }
      return receipt;
    },
    [persistGig]
  );

  const submitFeedback = useCallback((entry: Omit<FeedbackEntry, "id" | "createdAt">) => {
    const saved = addFeedback({ ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    setFeedback(loadFeedback());
    track("feedback_submitted", { rating: entry.rating });
    return saved;
  }, []);

  const value = useMemo(
    () => ({
      gigs,
      feedback,
      refresh,
      createGig,
      submitMilestone,
      approveMilestone,
      raiseDispute,
      resolveDispute,
      cancelGig,
      submitFeedback
    }),
    [
      gigs,
      feedback,
      refresh,
      createGig,
      submitMilestone,
      approveMilestone,
      raiseDispute,
      resolveDispute,
      cancelGig,
      submitFeedback
    ]
  );

  return <GigsContext.Provider value={value}>{children}</GigsContext.Provider>;
};

export const useGigs = () => {
  const context = useContext(GigsContext);
  if (!context) {
    throw new Error("useGigs must be used within GigsProvider");
  }
  return context;
};

