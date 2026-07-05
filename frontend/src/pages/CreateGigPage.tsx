import { FormEvent, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../components/Button";
import { TxConfirmation } from "../components/TxConfirmation";
import { useGigs } from "../hooks/useGigs";
import { useToast } from "../hooks/useToast";
import { useWallet } from "../hooks/useWallet";
import { explainError } from "../lib/errors";
import type { TxReceipt } from "../types";

export const CreateGigPage = () => {
  const { address } = useWallet();
  const { createGig } = useGigs();
  const { pushToast } = useToast();
  const [freelancer, setFreelancer] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [milestones, setMilestones] = useState([
    { description: "Discovery and project plan", amount: 50 },
    { description: "Final delivery", amount: 100 }
  ]);
  const [isLoading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);

  const total = milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!address) {
      pushToast({ type: "error", title: "Connect a wallet first" });
      return;
    }
    setLoading(true);
    try {
      const tx = await createGig({ client: address, freelancer, arbiter, milestones });
      setReceipt(tx);
      pushToast({ type: "success", title: "Gig funded", message: "The escrow record is ready for milestone submissions." });
    } catch (error) {
      pushToast({ type: "error", title: "Could not create gig", message: explainError(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page max-w-4xl">
      <h1 className="page-title">Create Gig</h1>
      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <label className="field">Freelancer address<input required className="input" value={freelancer} onChange={(e) => setFreelancer(e.target.value)} /></label>
        <label className="field">Arbiter address<input required className="input" value={arbiter} onChange={(e) => setArbiter(e.target.value)} /></label>
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Milestones</h2>
            <Button type="button" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setMilestones([...milestones, { description: "", amount: 0 }])}>Add</Button>
          </div>
          {milestones.map((milestone, index) => (
            <div className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_140px_44px]" key={index}>
              <input required className="input" placeholder="Milestone name" value={milestone.description} onChange={(e) => setMilestones(milestones.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} />
              <input required className="input" min="1" step="0.0000001" type="number" value={milestone.amount} onChange={(e) => setMilestones(milestones.map((item, i) => i === index ? { ...item, amount: Number(e.target.value) } : item))} />
              <Button type="button" variant="ghost" aria-label="Remove milestone" onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-ink p-4 text-white">
          <span className="font-bold">Total funding</span>
          <span className="text-xl font-black">{total.toFixed(2)} XLM</span>
        </div>
        <Button isLoading={isLoading} type="submit">Create and fund gig</Button>
      </form>
      <div className="mt-5"><TxConfirmation receipt={receipt} /></div>
    </section>
  );
};
