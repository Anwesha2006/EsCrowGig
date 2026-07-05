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

  if (!open || !address) {
    return null;
  }

  const finish = () => {
    if (name || useCase) {
      submitFeedback({ wallet: address, name, useCase });
    }
    localStorage.setItem(`escrowgig:onboarded:${address}`, "yes");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/45 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [BriefcaseBusiness, "Create terms", "Client, freelancer, arbiter, and milestones are locked together."],
            [LockKeyhole, "Fund safely", "The client funds testnet XLM before work starts."],
            [Scale, "Release or resolve", "Approvals pay freelancers, disputes route to the arbiter."]
          ].map(([Icon, title, copy]) => {
            const StepIcon = Icon as typeof BriefcaseBusiness;
            return (
              <div className="rounded-md border border-slate-200 p-4" key={title as string}>
                <StepIcon className="h-5 w-5 text-gold" />
                <p className="mt-3 font-bold text-ink">{title as string}</p>
                <p className="mt-1 text-sm text-slate-600">{copy as string}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input className="input" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Use case (optional)" value={useCase} onChange={(e) => setUseCase(e.target.value)} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={finish}>Start escrowing</Button>
        </div>
      </div>
    </div>
  );
};

