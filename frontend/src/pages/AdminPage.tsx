import { FormEvent, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "../components/Button";
import { useGigs } from "../hooks/useGigs";
import { useWallet } from "../hooks/useWallet";
import { useToast } from "../hooks/useToast";
import { contractInitialize, isContractInitialized, stellarExpertTxUrl } from "../lib/stellar";
import { explainError } from "../lib/errors";

export const AdminPage = () => {
  const { feedback } = useGigs();
  const { address } = useWallet();
  const { pushToast } = useToast();
  const [password, setPassword] = useState("");
  const [allowed, setAllowed] = useState(sessionStorage.getItem("escrowgig:admin") === "yes");
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initHash, setInitHash] = useState<string | null>(null);
  const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "escrowgig-admin";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password === adminPassword) {
      sessionStorage.setItem("escrowgig:admin", "yes");
      setAllowed(true);
    }
  };

  useEffect(() => {
    if (!allowed || !address) return;
    setInitialized(null);
    isContractInitialized(address)
      .then(setInitialized)
      .catch((error) => {
        setInitialized(null);
        pushToast({ type: "error", title: "Could not check contract", message: explainError(error) });
      });
  }, [address, allowed, pushToast]);

  const initialize = async () => {
    if (!address) {
      pushToast({ type: "error", title: "Connect the admin wallet first" });
      return;
    }
    setInitializing(true);
    try {
      const hash = await contractInitialize(address);
      setInitHash(hash);
      setInitialized(true);
      pushToast({ type: "success", title: "Contract initialized", message: `Transaction: ${hash}` });
    } catch (error) {
      pushToast({ type: "error", title: "Could not initialize contract", message: explainError(error) });
    } finally {
      setInitializing(false);
    }
  };

  if (!allowed) {
    return (
      <section className="page max-w-md">
        <h1 className="page-title">Admin</h1>
        <form className="card mt-6 grid gap-3 p-6" onSubmit={submit}>
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button icon={<Lock className="h-4 w-4" />}>Unlock</Button>
        </form>
      </section>
    );
  }

  return (
    <section className="page">
      <h1 className="page-title">Admin</h1>
      <div className="card mt-6 grid gap-3 p-6">
        <h2 className="text-lg font-bold text-ink">Contract setup</h2>
        {!address && <p className="text-sm text-body">Connect Account 1 to initialize the contract.</p>}
        {address && initialized === null && <p className="text-sm text-body">Checking contract status…</p>}
        {initialized === false && (
          <>
            <p className="text-sm text-body">This contract has not been initialized. The connected wallet will become its admin.</p>
            <Button isLoading={initializing} onClick={initialize}>Initialize Contract</Button>
          </>
        )}
        {initialized === true && <p className="text-sm font-semibold text-success">Contract is initialized.</p>}
        {initHash && (
          <a className="text-sm font-semibold text-primary underline" href={stellarExpertTxUrl(initHash)} target="_blank" rel="noreferrer">
            View initialization transaction on Stellar Expert
          </a>
        )}
      </div>
      <h2 className="page-title mt-10">Feedback</h2>
      <div className="card mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-primary-light text-ink">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Name</th>
              <th className="p-3">Use case</th>
              <th className="p-3">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((entry) => (
              <tr className="border-t border-border" key={entry.id}>
                <td className="p-3">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="max-w-xs break-all p-3">{entry.wallet}</td>
                <td className="p-3">{entry.rating ?? "-"}</td>
                <td className="p-3">{entry.name ?? "-"}</td>
                <td className="p-3">{entry.useCase ?? "-"}</td>
                <td className="p-3">{entry.improvement ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
