import { useEffect, useState } from "react";
import { BriefcaseBusiness, LockKeyhole, Scale } from "lucide-react";
import { Button } from "./Button";
import { useGigs } from "../hooks/useGigs";
import { useWallet } from "../hooks/useWallet";

export const OnboardingModal = () => {
  const { address } = useWallet();
  const { submitFeedback } = useGigs();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");

  useEffect(() => {
    if (address && localStorage.getItem(`escrowgig:onboarded:${address}`) !== "yes") {
      setOpen(true);
    }
  }, [address]);

  if (!open || !address) return null;

  const finish = () => {
    if (name || useCase) submitFeedback({ wallet: address, name, useCase });
    localStorage.setItem(`escrowgig:onboarded:${address}`, "yes");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 sm:items-center sm:px-4">
      <div className="w-full max-w-2xl rounded-t-2xl bg-white p-5 shadow-soft sm:rounded-2xl sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            [BriefcaseBusiness, "Create terms", "Client, freelancer, arbiter, and milestones are locked together."],
            [LockKeyhole, "Fund safely", "The client funds testnet XLM before work starts."],
            [Scale, "Release or resolve", "Approvals pay freelancers, disputes route to the arbiter."],
          ].map(([Icon, title, copy]) => {
            const StepIcon = Icon as typeof BriefcaseBusiness;
            return (
              <div className="rounded-xl border border-border p-3 sm:p-4" key={title as string}>
                <StepIcon className="h-5 w-5 text-primary" />
                <p className="mt-2 font-bold text-ink sm:mt-3">{title as string}</p>
                <p className="mt-1 text-xs text-body sm:text-sm">{copy as string}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
          <input className="input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Use case (optional)" value={useCase} onChange={(e) => setUseCase(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end sm:mt-5">
          <Button onClick={finish} className="w-full sm:w-auto">Start escrowing</Button>
        </div>
      </div>
    </div>
  );
};
