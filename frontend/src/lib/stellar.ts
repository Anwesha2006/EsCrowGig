import { Contract, Networks, rpc } from "@stellar/stellar-sdk";
import type { Gig, Milestone } from "../types";

export const contractId = import.meta.env.VITE_CONTRACT_ID as string;
export const networkPassphrase = Networks.TESTNET;
export const rpcUrl =
  (import.meta.env.VITE_SOROBAN_RPC_URL as string | undefined) ??
  "https://soroban-testnet.stellar.org";

export const stellarExpertTxUrl = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const getRpc = () => new rpc.Server(rpcUrl);

export const getContract = () => {
  if (!contractId) {
    throw new Error("Missing VITE_CONTRACT_ID");
  }
  return new Contract(contractId);
};

const fakeHash = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const submitContractAction = async (action: string) => {
  getContract();
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { hash: fakeHash(), action };
};

export const buildGigPayload = (
  client: string,
  freelancer: string,
  arbiter: string,
  milestones: Pick<Milestone, "description" | "amount">[]
): Gig => {
  const totalFunded = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

  return {
    id: `${Date.now()}`,
    client,
    freelancer,
    arbiter,
    totalFunded,
    isActive: true,
    createdAt: new Date().toISOString(),
    milestones: milestones.map((milestone, index) => ({
      id: index,
      description: milestone.description,
      amount: milestone.amount,
      status: "Pending",
      proof: ""
    }))
  };
};

