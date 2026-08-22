import {
  Contract,
  Networks,
  TransactionBuilder,
  Transaction,
  BASE_FEE,
  nativeToScVal,
  Address,
  xdr,
  rpc as StellarRpc,
  Horizon,
  scValToNative,
} from "@stellar/stellar-sdk";
import type { Gig, Milestone } from "../types";
import {
  signTransaction,
  requestAccess,
  isConnected,
} from "@stellar/freighter-api";
// ── Config ────────────────────────────────────────────────────────────────────
export const contractId = import.meta.env.VITE_CONTRACT_ID as string;
export const networkPassphrase = Networks.TESTNET;
export const rpcUrl =
  (import.meta.env.VITE_SOROBAN_RPC_URL as string | undefined) ??
  "https://soroban-testnet.stellar.org";
export const horizonUrl =
  (import.meta.env.VITE_HORIZON_URL as string | undefined) ??
  "https://horizon-testnet.stellar.org";

// Shared public clients make the network targets explicit to consumers of this module.
export const server = new StellarRpc.Server(rpcUrl);
export const horizonServer = new Horizon.Server(horizonUrl);

export const NATIVE_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const stellarExpertTxUrl = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const getRpc = () => server;

export const getContract = () => {
  if (!contractId) throw new Error("Missing VITE_CONTRACT_ID — add it to .env");
  return new Contract(contractId);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const xlmToStroops = (xlm: number): bigint =>
  BigInt(Math.round(xlm * 10_000_000));

const addrVal = (key: string): xdr.ScVal =>
  Address.fromString(key).toScVal();

/** Call window.freighterApi directly — bypasses the Kit wrapper that mishandles errors */
async function signWithFreighter(txXdr: string, expectedAddress: string): Promise<string> {
  // Try window.freighterApi first (modern), fall back to window.freighter
 const status = await isConnected();

if (!status.isConnected) {
  throw new Error("Freighter is not connected");
}

const access = await requestAccess();
if (access.error) {
  throw new Error(access.error.message);
}
if (access.address !== expectedAddress) {
  throw new Error(
    `Connected wallet (${access.address}) does not match the transaction client (${expectedAddress}).`
  );
}

const result = await signTransaction(txXdr, {
  networkPassphrase,
});

  // freighter-api v6 returns { signedTxXdr, signerAddress, error? }
  const r = result as { signedTxXdr?: string; error?: string | { message?: string } };
  if (r.error) {
    const msg =
      typeof r.error === "string"
        ? r.error
        : r.error.message ?? JSON.stringify(r.error);
    throw new Error(msg);
  }
  if (!r.signedTxXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }
  return r.signedTxXdr;
}

/** Poll until SUCCESS or FAILED, max ~30 seconds */
async function pollTransaction(
  server: StellarRpc.Server,
  hash: string
): Promise<StellarRpc.Api.GetTransactionResponse> {
  for (let i = 0; i < 20; i++) {
    try {
    const result = await server.getTransaction(hash);
    console.log("POLL RESULT", result);

    if (result.status !== StellarRpc.Api.GetTransactionStatus.NOT_FOUND) {
        return result;
    }
} catch (e) {
    console.error("getTransaction FAILED", e);
    // Don't throw here.
}

    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Transaction not confirmed after 30s. Check Stellar Expert.");
}

type TransactionKit = {
  signTransaction: (
    transactionXdr: string,
    options: { networkPassphrase: string }
  ) => Promise<string | { signedTxXdr?: string }>;
};

/** Simulate, assemble, sign, submit, and confirm a Soroban transaction. */
export async function simulateAndSubmit(
  transaction: Transaction,
  kit?: TransactionKit
): Promise<string> {
  const simulation = await server.simulateTransaction(transaction);
  if (StellarRpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulation failed: ${simulation.error}`);
  }
  const prepared = StellarRpc.assembleTransaction(transaction, simulation).build();
  const signed = kit
    ? await kit.signTransaction(prepared.toXDR(), { networkPassphrase })
    : await signWithFreighter(prepared.toXDR(), transaction.source);
  const signedXdr = typeof signed === "string" ? signed : signed.signedTxXdr;
  if (!signedXdr) throw new Error("Wallet did not return a signed transaction.");
  const response = await server.sendTransaction(
    TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
  );
  if (response.status === "ERROR") {
    throw new Error(`Submission failed: ${JSON.stringify(response.errorResult ?? "")}`);
  }
  const confirmed = await pollTransaction(server, response.hash);
  if (confirmed.status !== StellarRpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed on-chain: ${confirmed.status}`);
  }
  return response.hash;
}

/**
 * Core flow: fresh account → build(300s) → simulate → assemble → sign → submit → poll
 * Retries up to 3× on txTooLate (stale sequence).
 */
async function invokeContract(
  publicKey: string,
  functionName: string,
  ...args: xdr.ScVal[]
): Promise<{ hash: string; returnValue?: xdr.ScVal }> {
  const server = getRpc();
  const contract = getContract();
  const MAX = 3;

  for (let attempt = 1; attempt <= MAX; attempt++) {
    // Fresh sequence number every attempt
    const account = await server.getAccount(publicKey);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(300)
      .build();

    const sim = await server.simulateTransaction(tx);
    console.log("SIM", sim);
    if (StellarRpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ${sim.error}`);
    }

    console.log("SIM", sim);

const prepared = StellarRpc.assembleTransaction(tx, sim).build();
console.log("PREPARED", prepared);
    // Direct Freighter call — no Kit wrapper
    console.log("Before sign");
    const signedXdr = await signWithFreighter(prepared.toXDR(), publicKey);
console.log("After sign", signedXdr);
console.log("Before fromXDR");
    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    console.log("After fromXDR");
    console.log("Before send");
    const send = await server.sendTransaction(signedTx);
console.log("After send", JSON.stringify(send, null, 2));
    if (send.status === "ERROR") {
      const e = JSON.stringify(send.errorResult ?? "");
      if (e.includes("txTooLate") && attempt < MAX) { console.warn(`txTooLate attempt ${attempt}, retrying`); continue; }
      throw new Error(`Submission failed: ${e}`);
    }

    const confirmed = await pollTransaction(server, send.hash);
    if (confirmed.status !== StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      const e = confirmed.status;
      if (String(e).includes("txTooLate") && attempt < MAX) { console.warn(`txTooLate (poll) attempt ${attempt}, retrying`); continue; }
      throw new Error(`Transaction failed on-chain: ${e}`);
    }

    return { hash: send.hash, returnValue: sim.result?.retval };
  }

  throw new Error("Transaction failed after 3 attempts. Please try again.");
}

/** Token approve with the same retry pattern */
async function invokeTokenApprove(
  client: string,
  spender: string,
  amountStroops: bigint,
  expirationLedger: number
): Promise<void> {
  const server = getRpc();
  const tokenContract = new Contract(NATIVE_TOKEN_ID);
  const MAX = 3;

  for (let attempt = 1; attempt <= MAX; attempt++) {
    const account = await server.getAccount(client);

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(
        tokenContract.call(
          "approve",
          addrVal(client),
          addrVal(spender),
          nativeToScVal(amountStroops, { type: "i128" }),
          nativeToScVal(expirationLedger, { type: "u32" })
        )
      )
      .setTimeout(300)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (StellarRpc.Api.isSimulationError(sim)) {
      throw new Error(`Approve simulation failed: ${sim.error}`);
    }

    const prepared = StellarRpc.assembleTransaction(tx, sim).build();
    const signedXdr = await signWithFreighter(prepared.toXDR(), client);

    const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const send = await server.sendTransaction(signedTx);

    if (send.status === "ERROR") {
      const e = JSON.stringify(send.errorResult ?? "");
      if (e.includes("txTooLate") && attempt < MAX) { continue; }
      throw new Error(`Approve failed: ${e}`);
    }

    const confirmed = await pollTransaction(server, send.hash);
    if (confirmed.status !== StellarRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(`Approve failed on-chain: ${confirmed.status}`);
    }
    return;
  }

  throw new Error("Approve transaction failed after 3 attempts.");
}

// ── Contract function wrappers ────────────────────────────────────────────────

export const contractCreateGig = async (
  client: string,
  freelancer: string,
  arbiter: string,
  milestones: Pick<Milestone, "description" | "amount">[]
): Promise<{ hash: string; gigId: number }> => {
  if (!client) {
    throw new Error("A connected wallet address is required to create a gig.");
  }

  // ScMap keys MUST be alphabetical: "amount" < "description"
  const milestonesScVal = xdr.ScVal.scvVec(
    milestones.map((m) =>
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("amount"),
          val: nativeToScVal(BigInt(m.amount), { type: "i128" }),
        }),
        new xdr.ScMapEntry({
          key: xdr.ScVal.scvSymbol("description"),
          val: nativeToScVal(m.description, { type: "string" }),
        }),
      ])
    )
  );

  const result = await invokeContract(
    client,
    "create_gig",
    addrVal(client),
    addrVal(freelancer),
    addrVal(arbiter),
    milestonesScVal
  );
  if (!result.returnValue) {
    throw new Error("create_gig did not return a gig ID during simulation.");
  }
  const gigId = scValToNative(result.returnValue);
  if (typeof gigId !== "number" && typeof gigId !== "bigint") {
    throw new Error("create_gig returned an invalid gig ID.");
  }
  console.log("Gig ID:", gigId);
  return { hash: result.hash, gigId: Number(gigId) };
};

/** One-time setup. The connected wallet becomes the contract admin. */
export const contractInitialize = async (admin: string): Promise<string> =>
  (await invokeContract(
    admin,
    "initialize",
    addrVal(admin),
    addrVal(NATIVE_TOKEN_ID)
  )).hash;

/**
 * `get_gig(0)` distinguishes an initialized contract (#3 if no gig exists)
 * from an uninitialized one (#2).
 */
export const isContractInitialized = async (source: string): Promise<boolean> => {
  const account = await server.getAccount(source);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(getContract().call("get_gig", nativeToScVal(0, { type: "u32" })))
    .setTimeout(300)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (!StellarRpc.Api.isSimulationError(simulation)) return true;
  return !/Error\(Contract, #2\)|NotInitialized/.test(
    String(simulation.error)
  );
};

export const contractFundGig = async (
  client: string,
  gigId: number,
  totalXLM: number
): Promise<string> => {
  const server = getRpc();
  const totalStroops = xlmToStroops(totalXLM);
  const ledger = await server.getLatestLedger();
  const expirationLedger = ledger.sequence + 500;

  // 1. Approve the escrow contract to pull XLM from the client
  await invokeTokenApprove(client, contractId, totalStroops, expirationLedger);

  // 2. fund_gig pulls the XLM using the allowance
  return (await invokeContract(
    client,
    "fund_gig",
    nativeToScVal(gigId, { type: "u32" })
  )).hash;
};

export const contractSubmitMilestone = async (
  freelancer: string,
  gigId: number,
  milestoneId: number,
  proofUrl: string
): Promise<string> =>
  (await invokeContract(
    freelancer,
    "submit_milestone",
    nativeToScVal(gigId, { type: "u32" }),
    nativeToScVal(milestoneId, { type: "u32" }),
    nativeToScVal(proofUrl, { type: "string" })
  )).hash;

export const contractApproveMilestone = async (
  client: string,
  gigId: number,
  milestoneId: number
): Promise<string> =>
  (await invokeContract(
    client,
    "approve_milestone",
    nativeToScVal(gigId, { type: "u32" }),
    nativeToScVal(milestoneId, { type: "u32" })
  )).hash;

export const contractRaiseDispute = async (
  caller: string,
  gigId: number,
  milestoneId: number
): Promise<string> =>
  (await invokeContract(
    caller,
    "raise_dispute_as",
    addrVal(caller),
    nativeToScVal(gigId, { type: "u32" }),
    nativeToScVal(milestoneId, { type: "u32" })
  )).hash;

export const contractResolveDispute = async (
  arbiter: string,
  gigId: number,
  milestoneId: number,
  releaseTo: string
): Promise<string> =>
  (await invokeContract(
    arbiter,
    "resolve_dispute",
    nativeToScVal(gigId, { type: "u32" }),
    nativeToScVal(milestoneId, { type: "u32" }),
    addrVal(releaseTo)
  )).hash;

export const contractCancelGig = async (
  client: string,
  gigId: number
): Promise<string> =>
  (await invokeContract(
    client,
    "cancel_gig",
    nativeToScVal(gigId, { type: "u32" })
  )).hash;

// Public names used by the React contract hook. The prefixed names remain for
// backwards compatibility with the existing gig state provider.
export const createGig = contractCreateGig;
export const fundGig = contractFundGig;
export const submitMilestone = contractSubmitMilestone;
export const approveMilestone = contractApproveMilestone;
export const raiseDispute = contractRaiseDispute;
export const resolveDispute = contractResolveDispute;

/** Reads the on-chain `get_gig` value with a fresh source account. */
export const getGig = async (gigId: number, source?: string): Promise<Gig> => {
  const readSource = source ?? (import.meta.env.VITE_READ_ACCOUNT as string | undefined);
  if (!readSource) {
    throw new Error("getGig requires a source account or VITE_READ_ACCOUNT.");
  }
  const account = await server.getAccount(readSource);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(getContract().call("get_gig", nativeToScVal(gigId, { type: "u32" })))
    .setTimeout(300)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (StellarRpc.Api.isSimulationError(simulation)) {
    throw new Error(`get_gig simulation failed: ${simulation.error}`);
  }
  if (!simulation.result?.retval) throw new Error("Gig was not returned by the contract.");
  return scValToNative(simulation.result.retval) as Gig;
};

// ── Local gig payload builder ─────────────────────────────────────────────────
export const buildGigPayload = (
  client: string,
  freelancer: string,
  arbiter: string,
  milestones: Pick<Milestone, "description" | "amount">[],
  onChainId: number
): Gig => ({
  id: String(onChainId),
  client,
  freelancer,
  arbiter,
  totalFunded: milestones.reduce((sum, m) => sum + m.amount, 0),
  isActive: true,
  createdAt: new Date().toISOString(),
  milestones: milestones.map((m, i) => ({
    id: i,
    description: m.description,
    amount: m.amount,
    status: "Pending",
    proof: "",
  })),
});
