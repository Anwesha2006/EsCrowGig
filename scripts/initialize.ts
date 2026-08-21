import { readFileSync, existsSync } from "node:fs";
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";

const NATIVE_TOKEN_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
const RPC_URL = process.env.VITE_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

async function main() {
  // Prefer a root .env for secrets; frontend/.env supplies public Vite configuration.
  loadEnvFile(".env");
  loadEnvFile("frontend/.env");

  const contractId = process.env.VITE_CONTRACT_ID;
  const secret = process.env.DEPLOYER_SECRET_KEY;
  if (!contractId) throw new Error("Missing VITE_CONTRACT_ID in .env or frontend/.env.");
  if (!secret) throw new Error("Missing DEPLOYER_SECRET_KEY in .env. Do not use a VITE_ variable for it.");

  const signer = Keypair.fromSecret(secret);
  const admin = process.env.ADMIN_PUBLIC_KEY ?? signer.publicKey();
  const server = new StellarRpc.Server(RPC_URL);
  const account = await server.getAccount(signer.publicKey());
  const transaction = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(contractId).call("initialize", Address.fromString(admin).toScVal(), Address.fromString(NATIVE_TOKEN_ID).toScVal()))
    .setTimeout(300)
    .build();
  const simulation = await server.simulateTransaction(transaction);
  if (StellarRpc.Api.isSimulationError(simulation)) throw new Error(`Initialization simulation failed: ${simulation.error}`);

  const prepared = StellarRpc.assembleTransaction(transaction, simulation).build();
  prepared.sign(signer);
  const submitted = await server.sendTransaction(prepared);
  if (submitted.status === "ERROR") throw new Error(`Initialization submission failed: ${JSON.stringify(submitted.errorResult ?? "")}`);

  console.log(`Initialization submitted: ${submitted.hash}`);
  console.log(`https://stellar.expert/explorer/testnet/tx/${submitted.hash}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
