import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FeedbackEntry, Gig, MilestoneStatus, TxReceipt } from "../types";
import { analytics } from "../lib/analytics";
import { addFeedback, loadFeedback, loadGigs, upsertGig } from "../lib/storage";
import {
  buildGigPayload,
  contractApproveMilestone,
  contractCancelGig,
  contractCreateGig,
  contractFundGig,
  contractRaiseDispute,
  contractResolveDispute,
  contractSubmitMilestone,
  getRpc,
  networkPassphrase,
} from "../lib/stellar";
import {
  rpc as StellarRpc,
  scValToNative,
} from "@stellar/stellar-sdk";

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

const setMilestoneStatus = (
  gig: Gig,
  milestoneId: number,
  status: MilestoneStatus,
  proof?: string
): Gig => ({
  ...gig,
  milestones: gig.milestones.map((m) =>
    m.id === milestoneId ? { ...m, status, proof: proof ?? m.proof } : m
  ),
});

/** Extract the u32 gig ID from a confirmed transaction's return value */
async function extractGigIdFromTx(hash: string): Promise<number> {
  const server = getRpc();
  const result = await server.getTransaction(hash);
  if (
    result.status === StellarRpc.Api.GetTransactionStatus.SUCCESS &&
    result.returnValue
  ) {
    try {
      const native = scValToNative(result.returnValue);
      if (typeof native === "number" || typeof native === "bigint") {
        return Number(native);
      }
    } catch {
      // fall through to timestamp fallback
    }
  }
  // Fallback: use timestamp as local ID (still shows real tx hash)
  return Date.now();
}

export const GigsProvider = ({ children }: { children: ReactNode }) => {
  const [gigs, setGigs] = useState<Gig[]>(loadGigs);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(loadFeedback);

  const refresh = useCallback(() => {
    setGigs(loadGigs());
    setFeedback(loadFeedback());
  }, []);

  const persistGig = useCallback((gig: Gig) => {
    upsertGig(gig);
    setGigs(loadGigs());
    return gig;
  }, []);

  const createGig = useCallback(
    async (input: CreateGigInput): Promise<TxReceipt> => {
      // Step 1: create_gig on chain → returns gig ID
      const createHash = await contractCreateGig(
        input.client,
        input.freelancer,
        input.arbiter,
        input.milestones
      );

      const onChainId = await extractGigIdFromTx(createHash);

      // Step 2: fund_gig (approve allowance + transfer XLM to contract)
      const totalXLM = input.milestones.reduce((s, m) => s + m.amount, 0);
      const fundHash = await contractFundGig(input.client, onChainId, totalXLM);

      // Step 3: persist locally
      const gig = buildGigPayload(
        input.client,
        input.freelancer,
        input.arbiter,
        input.milestones,
        onChainId
      );
      persistGig({ ...gig, lastTxHash: fundHash });

      analytics.gigCreated({
        publicKey: input.client,
        milestoneCount: input.milestones.length,
        totalAmount: gig.totalFunded,
        freelancerAddress: input.freelancer,
      });

      return { hash: fundHash, action: "create_gig + fund_gig" };
    },
    [persistGig]
  );

  const submitMilestone = useCallback(
    async (gigId: string, milestoneId: number, proof: string): Promise<TxReceipt> => {
      const gig = loadGigs().find((g) => g.id === gigId);
      if (!gig) throw new Error("Gig not found");

      const hash = await contractSubmitMilestone(
        gig.freelancer,
        Number(gigId),
        milestoneId,
        proof
      );
      persistGig({ ...setMilestoneStatus(gig, milestoneId, "Submitted", proof), lastTxHash: hash });

      analytics.milestoneSubmitted({
        publicKey: gig.freelancer,
        gigId,
        milestoneId,
        proofUrl: proof,
      });

      return { hash, action: "submit_milestone" };
    },
    [persistGig]
  );

  const approveMilestone = useCallback(
    async (gigId: string, milestoneId: number): Promise<TxReceipt> => {
      const gig = loadGigs().find((g) => g.id === gigId);
      if (!gig) throw new Error("Gig not found");

      const hash = await contractApproveMilestone(gig.client, Number(gigId), milestoneId);
      persistGig({ ...setMilestoneStatus(gig, milestoneId, "Approved"), lastTxHash: hash });

      analytics.milestoneApproved({
        publicKey: gig.client,
        gigId,
        milestoneId,
        amountReleased: gig.milestones.find((m) => m.id === milestoneId)?.amount ?? 0,
      });

      return { hash, action: "approve_milestone" };
    },
    [persistGig]
  );

  const raiseDispute = useCallback(
    async (gigId: string, milestoneId: number): Promise<TxReceipt> => {
      const gig = loadGigs().find((g) => g.id === gigId);
      if (!gig) throw new Error("Gig not found");

      // Use the connected wallet address — could be client or freelancer
      // We pass gig.client as the default; GigDetailPage passes the right role
      const hash = await contractRaiseDispute(gig.client, Number(gigId), milestoneId);
      persistGig({ ...setMilestoneStatus(gig, milestoneId, "Disputed"), lastTxHash: hash });

      analytics.disputeRaised({
        publicKey: gig.client,
        gigId,
        milestoneId,
        raisedBy: "client",
      });

      return { hash, action: "raise_dispute_as" };
    },
    [persistGig]
  );

  const resolveDispute = useCallback(
    async (gigId: string, milestoneId: number, releaseTo: string): Promise<TxReceipt> => {
      const gig = loadGigs().find((g) => g.id === gigId);
      if (!gig) throw new Error("Gig not found");

      const hash = await contractResolveDispute(
        gig.arbiter,
        Number(gigId),
        milestoneId,
        releaseTo
      );
      persistGig({ ...setMilestoneStatus(gig, milestoneId, "Approved"), lastTxHash: hash });

      analytics.disputeResolved({
        publicKey: gig.arbiter,
        gigId,
        milestoneId,
        resolvedIn: releaseTo === gig.client ? "client" : "freelancer",
      });

      return { hash, action: `resolve_dispute → ${releaseTo.slice(0, 8)}…` };
    },
    [persistGig]
  );

  const cancelGig = useCallback(
    async (gigId: string): Promise<TxReceipt> => {
      const gig = loadGigs().find((g) => g.id === gigId);
      if (!gig) throw new Error("Gig not found");

      const hash = await contractCancelGig(gig.client, Number(gigId));
      persistGig({ ...gig, isActive: false, lastTxHash: hash });

      return { hash, action: "cancel_gig" };
    },
    [persistGig]
  );

  const submitFeedback = useCallback(
    (entry: Omit<FeedbackEntry, "id" | "createdAt">) => {
      const saved = addFeedback({
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      setFeedback(loadFeedback());
      analytics.feedbackSubmitted({
        publicKey: entry.wallet,
        rating: entry.rating ?? 0,
        comment: entry.improvement ?? "",
      });
      return saved;
    },
    []
  );

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
      submitFeedback,
    }),
    [
      gigs, feedback, refresh,
      createGig, submitMilestone, approveMilestone,
      raiseDispute, resolveDispute, cancelGig, submitFeedback,
    ]
  );

  return <GigsContext.Provider value={value}>{children}</GigsContext.Provider>;
};

export const useGigs = () => {
  const ctx = useContext(GigsContext);
  if (!ctx) throw new Error("useGigs must be used within GigsProvider");
  return ctx;
};
