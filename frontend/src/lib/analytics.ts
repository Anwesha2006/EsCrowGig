import posthog from "posthog-js";

// posthog is initialised once in main.tsx — this file only wraps capture calls

export const analytics = {
  walletConnected: (publicKey: string) => {
    posthog.identify(publicKey, {
      wallet_address: publicKey,
      first_seen: new Date().toISOString()
    });
    posthog.capture("wallet_connected", {
      wallet_address: publicKey,
      timestamp: new Date().toISOString()
    });
  },

  walletDisconnected: (publicKey: string) => {
    posthog.capture("wallet_disconnected", {
      wallet_address: publicKey,
      timestamp: new Date().toISOString()
    });
    posthog.reset();
  },

  gigCreated: (data: {
    publicKey: string;
    milestoneCount: number;
    totalAmount: number;
    freelancerAddress: string;
  }) => {
    posthog.capture("gig_created", {
      wallet_address: data.publicKey,
      milestone_count: data.milestoneCount,
      total_amount_xlm: data.totalAmount,
      freelancer_address: data.freelancerAddress,
      timestamp: new Date().toISOString()
    });
  },

  gigFunded: (data: { publicKey: string; gigId: string; amountXLM: number }) => {
    posthog.capture("gig_funded", {
      wallet_address: data.publicKey,
      gig_id: data.gigId,
      amount_xlm: data.amountXLM,
      timestamp: new Date().toISOString()
    });
  },

  milestoneSubmitted: (data: {
    publicKey: string;
    gigId: string;
    milestoneId: number;
    proofUrl: string;
  }) => {
    posthog.capture("milestone_submitted", {
      wallet_address: data.publicKey,
      gig_id: data.gigId,
      milestone_id: data.milestoneId,
      has_proof: !!data.proofUrl,
      timestamp: new Date().toISOString()
    });
  },

  milestoneApproved: (data: {
    publicKey: string;
    gigId: string;
    milestoneId: number;
    amountReleased: number;
  }) => {
    posthog.capture("milestone_approved", {
      wallet_address: data.publicKey,
      gig_id: data.gigId,
      milestone_id: data.milestoneId,
      amount_released_xlm: data.amountReleased,
      timestamp: new Date().toISOString()
    });
  },

  disputeRaised: (data: {
    publicKey: string;
    gigId: string;
    milestoneId: number;
    raisedBy: "client" | "freelancer";
  }) => {
    posthog.capture("dispute_raised", {
      wallet_address: data.publicKey,
      gig_id: data.gigId,
      milestone_id: data.milestoneId,
      raised_by: data.raisedBy,
      timestamp: new Date().toISOString()
    });
  },

  disputeResolved: (data: {
    publicKey: string;
    gigId: string;
    milestoneId: number;
    resolvedIn: "client" | "freelancer";
  }) => {
    posthog.capture("dispute_resolved", {
      wallet_address: data.publicKey,
      gig_id: data.gigId,
      milestone_id: data.milestoneId,
      resolved_in_favor_of: data.resolvedIn,
      timestamp: new Date().toISOString()
    });
  },

  feedbackSubmitted: (data: { publicKey: string; rating: number; comment: string }) => {
    posthog.capture("feedback_submitted", {
      wallet_address: data.publicKey,
      rating: data.rating,
      has_comment: !!data.comment,
      timestamp: new Date().toISOString()
    });
  },

  pageViewed: (pageName: string, properties?: object) => {
    posthog.capture("$pageview", { page: pageName, ...properties });
  },

  errorOccurred: (data: { error: string; page: string; publicKey?: string }) => {
    posthog.capture("error_occurred", {
      error_message: data.error,
      page: data.page,
      wallet_address: data.publicKey ?? "not_connected",
      timestamp: new Date().toISOString()
    });
  }
};

// Legacy shim — keeps existing track() call sites working
export type AnalyticsEvent =
  | "wallet_connected"
  | "wallet_disconnected"
  | "gig_created"
  | "milestone_submitted"
  | "milestone_approved"
  | "dispute_raised"
  | "feedback_submitted";

export const track = (event: AnalyticsEvent, properties: Record<string, unknown> = {}) => {
  posthog.capture(event, properties);
};
