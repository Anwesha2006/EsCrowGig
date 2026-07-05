import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Scale } from "lucide-react";
import { Button } from "../components/Button";
import { useWallet } from "../hooks/useWallet";

export const LandingPage = () => {
  const { address, connect, isConnecting } = useWallet();

  return (
    <div className="bg-cloud">
      <section className="mx-auto grid min-h-[calc(100vh-68px)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-moss">Stellar testnet escrow</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
            EscrowGig
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Milestone-based freelance escrow on Stellar. Clients fund work up front, freelancers submit proof, and arbiters resolve edge cases without platform custody.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {address ? (
              <Link to="/dashboard">
                <Button icon={<ArrowRight className="h-4 w-4" />}>Open dashboard</Button>
              </Link>
            ) : (
              <Button isLoading={isConnecting} onClick={connect} icon={<ArrowRight className="h-4 w-4" />}>
                Connect wallet
              </Button>
            )}
            <Link to="/create"><Button variant="secondary">Create a gig</Button></Link>
          </div>
        </div>
        <div className="grid gap-4">
          {[
            [LockKeyhole, "Funded milestones", "XLM stays locked until a milestone is approved or resolved."],
            [CheckCircle2, "Proof-first approvals", "Every submission carries a proof URL before funds are released."],
            [Scale, "Built-in arbitration", "A preassigned arbiter can release disputed funds to either side."]
          ].map(([Icon, title, copy]) => {
            const CardIcon = Icon as typeof LockKeyhole;
            return (
              <article className="rounded-md border border-slate-200 bg-white p-5 shadow-soft" key={title as string}>
                <CardIcon className="h-6 w-6 text-gold" />
                <h2 className="mt-4 text-xl font-bold text-ink">{title as string}</h2>
                <p className="mt-2 text-slate-600">{copy as string}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
