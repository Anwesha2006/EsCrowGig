import posthog from "posthog-js";

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

if (key) {
  posthog.init(key, {
    api_host: "https://app.posthog.com",
    capture_pageview: true
  });
}

export type AnalyticsEvent =
  | "wallet_connected"
  | "gig_created"
  | "milestone_submitted"
  | "milestone_approved"
  | "dispute_raised"
  | "feedback_submitted";

export const track = (event: AnalyticsEvent, properties: Record<string, unknown> = {}) => {
  if (key) {
    posthog.capture(event, properties);
    return;
  }

  const log = JSON.parse(localStorage.getItem("escrowgig:events") ?? "[]") as unknown[];
  log.unshift({ event, properties, createdAt: new Date().toISOString() });
  localStorage.setItem("escrowgig:events", JSON.stringify(log.slice(0, 250)));
};

