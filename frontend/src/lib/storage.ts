import type { FeedbackEntry, Gig } from "../types";

const GIGS_KEY = "escrowgig:gigs";
const FEEDBACK_KEY = "escrowgig:feedback";

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadGigs = () => read<Gig[]>(GIGS_KEY, []);

export const saveGigs = (gigs: Gig[]) => write(GIGS_KEY, gigs);

export const upsertGig = (gig: Gig) => {
  const gigs = loadGigs();
  const index = gigs.findIndex((item) => item.id === gig.id);
  if (index >= 0) {
    gigs[index] = gig;
  } else {
    gigs.unshift(gig);
  }
  saveGigs(gigs);
  return gig;
};

export const loadFeedback = () => read<FeedbackEntry[]>(FEEDBACK_KEY, []);

export const addFeedback = (entry: FeedbackEntry) => {
  const entries = [entry, ...loadFeedback()];
  write(FEEDBACK_KEY, entries);
  return entry;
};

