import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleDollarSign, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { useWallet } from "../hooks/useWallet";
import type { MilestoneStatus } from "../types";

const partners = ["Stellar", "Soroban", "Freighter", "Supabase", "PostHog"];

const mockMilestones: Array<{ label: string; detail: string; status: MilestoneStatus }> = [
  { label: "Scope approved", detail: "500 XLM via Soroban", status: "Approved" },
  { label: "Design delivery", detail: "Proof URL attached", status: "Submitted" },
  { label: "Final handoff", detail: "750 XLM pending", status: "Pending" }
];

const GigCard = ({ role, side }: { role: "Freelancer" | "Client"; side: "left" | "right" }) => (
  <article className={`card w-full max-w-[290px] p-4 ${side === "left" ? "lg:justify-self-end" : "lg:justify-self-start"}`}>
    <div className="flex items-center justify-between border-b border-border pb-3">
      <p className="text-sm font-extrabold text-ink">Gig Deal</p>
      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">Role: {role}</span>
    </div>
    <div className="mt-4 grid gap-3">
      {mockMilestones.map((milestone) => (
        <div className="flex items-start justify-between gap-3" key={`${role}-${milestone.label}`}>
          <div>
            <p className="text-sm font-bold text-ink">{role === "Freelancer" ? milestone.label : milestone.label.replace("approved", "locked")}</p>
            <p className="mt-0.5 text-xs text-muted">{milestone.detail}</p>
          </div>
          <StatusBadge status={milestone.status} />
        </div>
      ))}
    </div>
    <div className="mt-4 rounded-[10px] bg-primary-light px-3 py-2 text-xs font-semibold text-body">
      Funds held until confirmed by both parties
    </div>
  </article>
);

export const LandingPage = () => {
  const { address, openModal, isConnecting } = useWallet();

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-white px-4 pb-16 pt-12">
        <div className="pointer-events-none absolute -left-28 top-32 h-72 w-72 rounded-full border-[42px] border-primary-light opacity-80" />
        <div className="pointer-events-none absolute -right-28 top-32 h-72 w-72 rounded-full border-[42px] border-primary-light opacity-80" />

        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex rounded-full bg-primary-light px-4 py-1.5 text-[13px] font-bold text-primary">
            Buy, Sell, or Offer Services - Safely.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-[32px] font-extrabold leading-tight text-ink sm:text-[52px]">
            Transact <span className="accent">Safely.</span>
            <br />
            Trust <span className="accent">EscrowGig.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[480px] text-base text-body">
            With EscrowGig's milestone escrow system, freelancers and clients transact without risk - funds release only when work is done.
          </p>
          <div className="mx-auto mt-7 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
            <Link to="/dashboard" className="sm:flex-1">
              <Button variant="secondary" className="w-full">See how it works</Button>
            </Link>
            {address ? (
              <Link to="/create" className="sm:flex-1">
                <Button icon={<ArrowRight className="h-4 w-4" />} className="w-full">Create Gig</Button>
              </Link>
            ) : (
              <Button isLoading={isConnecting} onClick={openModal} icon={<ArrowRight className="h-4 w-4" />} className="w-full sm:flex-1">
                Get Started Free
              </Button>
            )}
          </div>

          <div className="mx-auto mt-9 flex max-w-4xl flex-col items-center gap-4 text-left sm:flex-row sm:justify-center">
            <p className="text-xs font-semibold text-muted">Key Partners / Built on</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {partners.map((partner) => (
                <span className="text-sm font-extrabold uppercase tracking-wide text-muted" key={partner}>{partner}</span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl items-center gap-5 lg:grid-cols-[1fr_210px_1fr]">
            <GigCard role="Freelancer" side="left" />
            <div className="card mx-auto grid h-[210px] w-[210px] place-items-center bg-primary-light/60 p-5">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-primary">
                  <LockKeyhole className="h-8 w-8 text-primary" />
                </div>
                <p className="mt-5 text-3xl font-black text-primary">EscrowGig</p>
                <p className="text-xs font-bold text-body">Escrow operations</p>
              </div>
            </div>
            <GigCard role="Client" side="right" />
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-extrabold text-ink sm:text-4xl">How <span className="accent">EscrowGig</span> Works</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              [LockKeyhole, "Client Locks Funds", "Funds are deposited into a Soroban smart contract, not held by us."],
              [CheckCircle2, "Freelancer Delivers", "Work is submitted milestone by milestone with proof attached."],
              [CircleDollarSign, "Funds Released", "Client approves each milestone, funds transfer instantly."]
            ].map(([Icon, title, copy]) => {
              const StepIcon = Icon as typeof LockKeyhole;
              return (
                <article className="card p-6 text-center" key={title as string}>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-light">
                    <StepIcon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mt-5 text-[22px] font-extrabold text-ink">{title as string}</h3>
                  <p className="mt-3 text-body">{copy as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-cloud px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-ink sm:text-4xl">Why Choose <span className="accent">EscrowGig</span></h2>
            <div className="mt-6 grid gap-4">
              {[
                "Zero platform custody - funds stay in smart contract",
                "Near-zero fees on Stellar blockchain",
                "Dispute resolution with neutral arbiter",
                "Works across borders, any currency via anchors"
              ].map((item) => (
                <p className="flex items-start gap-3 text-body" key={item}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-primary" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </div>
          <article className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Gig Detail</p>
                <h3 className="mt-1 text-[22px] font-extrabold text-ink">Website launch package</h3>
              </div>
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ["Brand and wireframes", "850 XLM", "Approved"],
                ["Production build", "1,150 XLM", "Pending"]
              ].map(([name, amount, status]) => (
                <div className="rounded-[12px] border border-border p-4" key={name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{name}</p>
                      <p className="mt-1 text-sm text-body">{amount}</p>
                    </div>
                    <StatusBadge status={status as MilestoneStatus} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="bg-primary-light px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-6 text-center md:grid-cols-3">
          {["1,200+ Gigs Created", "$340K+ Secured", "98% Satisfaction"].map((stat) => {
            const [value, ...label] = stat.split(" ");
            return (
              <div key={stat}>
                <p className="text-4xl font-black text-primary">{value}</p>
                <p className="mt-1 font-semibold text-muted">{label.join(" ")}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-primary px-4 py-14 text-center text-white">
        <h2 className="text-2xl font-extrabold sm:text-4xl">Start Your First Gig Today</h2>
        <p className="mt-3 text-white/85">Free to use. No middlemen. Powered by Stellar.</p>
        <div className="mt-7">
          <Button variant="secondary" onClick={address ? undefined : openModal} className="border-white bg-white text-primary hover:bg-primary-light">
            Connect Wallet & Begin
          </Button>
        </div>
      </section>

      <footer className="bg-ink px-4 py-10 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_2fr]">
          <div className="flex items-center gap-2 text-xl font-black">
            <ShieldCheck className="h-6 w-6 text-primary" />
            EscrowGig
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ["Product", "Dashboard", "Create Gig", "Stats"],
              ["Resources", "Stellar", "Soroban", "Docs"],
              ["Company", "Contact", "Security", "Terms"]
            ].map(([title, ...links]) => (
              <div key={title}>
                <p className="font-bold">{title}</p>
                <div className="mt-3 grid gap-2 text-sm text-white/65">
                  {links.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-white/60">
          <p>© 2025 EscrowGig. Built on Stellar.</p>
          <span className="rounded-full bg-white/10 px-3 py-1 font-bold text-white">Stellar</span>
        </div>
      </footer>
    </div>
  );
};
