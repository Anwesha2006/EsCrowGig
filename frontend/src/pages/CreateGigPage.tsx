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
    { description: "Final delivery", amount: 100 },
  ]);
  const [isLoading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);

  const total = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

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
      pushToast({
        type: "success",
        title: "Gig funded",
        message: "The escrow record is ready for milestone submissions.",
      });
    } catch (error) {
      pushToast({ type: "error", title: "Could not create gig", message: explainError(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[600px] px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      <h1 className="page-title text-center">Create Gig</h1>
      <p className="page-copy mx-auto mt-1 text-center text-sm sm:text-base">
        Define the parties, split the work into milestones, and fund the Soroban escrow.
      </p>

      <form className="card mt-6 grid gap-5 p-4 sm:mt-7 sm:gap-6 sm:p-6" onSubmit={submit}>
        {/* Participants */}
        <div className="grid gap-3 sm:gap-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Participants</p>
          <label className="field">
            Freelancer address
            <input
              required
              className="input"
              placeholder="G..."
              value={freelancer}
              onChange={(e) => setFreelancer(e.target.value)}
            />
          </label>
          <label className="field">
            Arbiter address
            <input
              required
              className="input"
              placeholder="G..."
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
            />
          </label>
        </div>

        {/* Milestones */}
        <div className="grid gap-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Milestones</p>
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-2xl border border-border bg-white p-3 sm:p-4"
            >
              <input
                required
                className="input"
                placeholder="Milestone description"
                value={milestone.description}
                onChange={(e) =>
                  setMilestones(
                    milestones.map((item, i) =>
                      i === index ? { ...item, description: e.target.value } : item
                    )
                  )
                }
              />
              <div className="flex gap-2">
                <input
                  required
                  className="input flex-1"
                  min="1"
                  step="0.0000001"
                  type="number"
                  placeholder="Amount (XLM)"
                  value={milestone.amount}
                  onChange={(e) =>
                    setMilestones(
                      milestones.map((item, i) =>
                        i === index ? { ...item, amount: Number(e.target.value) } : item
                      )
                    )
                  }
                />
                <button
                  type="button"
                  aria-label="Remove milestone"
                  className="grid h-11 w-11 flex-none place-items-center rounded-[10px] text-danger transition hover:bg-red-50"
                  onClick={() => setMilestones(milestones.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-primary bg-primary-light/50 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary-light active:opacity-80"
            onClick={() => setMilestones([...milestones, { description: "", amount: 0 }])}
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        </div>

        {/* Total */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-primary-light p-4 text-ink">
          <span className="font-bold">Total amount</span>
          <span className="text-xl font-black text-primary sm:text-2xl">
            {total.toFixed(2)} XLM
          </span>
        </div>

        <Button isLoading={isLoading} type="submit" className="w-full">
          Fund &amp; Deploy Gig
        </Button>
      </form>

      <div className="mt-4 sm:mt-5">
        <TxConfirmation receipt={receipt} />
      </div>
    </section>
  );
};
