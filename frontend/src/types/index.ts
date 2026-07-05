export type MilestoneStatus = "Pending" | "Submitted" | "Approved" | "Disputed";

export type Milestone = {
  id: number;
  description: string;
  amount: number;
  status: MilestoneStatus;
  proof: string;
};

export type Gig = {
  id: string;
  client: string;
  freelancer: string;
  arbiter: string;
  milestones: Milestone[];
  totalFunded: number;
  isActive: boolean;
  createdAt: string;
  lastTxHash?: string;
};

export type FeedbackEntry = {
  id: string;
  createdAt: string;
  wallet: string;
  name?: string;
  useCase?: string;
  rating?: number;
  improvement?: string;
};

export type Toast = {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
};

export type TxReceipt = {
  hash: string;
  action: string;
};

