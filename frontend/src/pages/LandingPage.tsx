import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleDollarSign, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { useWallet } from "../hooks/useWallet";
import { useReveal } from "../hooks/useReveal";
import type { MilestoneStatus } from "../types";

const partners = ["Stellar", "Soroban", "Freighter", "Supabase", "PostHog"];

const mockMilestones: Array<{ label: string; detail: string; status: MilestoneStatus }> = [
  { label: "Scope approved", detail: "500 XLM via Soroban", status: "Approved" },
  { label: "Design delivery", detail: "Proof URL attached", status: "Submitted" },
  { label: "Final handoff", detail: "750 XLM pending", status: "Pending" },
];

const GigCard = ({ role, side, delay = 0 }: { role: "Freelancer" | "Client"; side: "left" | "right"; delay?: number }) => (
  <article
    className={`card animate-fade-up w-full p-4 sm:max-w-[290px] ${
      side === "left" ? "lg:justify-self-end" : "lg:justify-self-start"
    }`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between border-b border-border pb-3">
      <p className="text-sm font-extrabold text-ink">Gig Deal</p>
      <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
        Role: {role}
      </span>
    </div>
    <div className="mt-4 grid gap-3">
      {mockMilestones.map((milestone) => (
        <div className="flex items-start justify-between gap-3" key={`${role}-${milestone.label}`}>
          <div>
            <p className="text-sm font-bold text-ink">
              {role === "Freelancer" ? milestone.label : milestone.label.replace("approved", "locked")}
            </p>
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

  // scroll reveal refs
  const howRef = useReveal() as React.RefObject<HTMLDivElement>;
  const whyRef = useReveal() as React.RefObject<HTMLDivElement>;
  const statsRef = useReveal() as React.RefObject<HTMLDivElement>;
  const ctaRef = useReveal() as React.RefObject<HTMLDivElement>;

  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white px-4 pb-12 pt-10 sm:pb-16 sm:pt-12">
        {/* floating bg circles */}
        <div className="pointer-events-none absolute -left-28 top-32 h-72 w-72 animate-float rounded-full border-[42px] border-primary-light opacity-60" />
        <div className="pointer-events-none absolute -right-28 top-32 h-72 w-72 animate-float rounded-full border-[42px] border-primary-light opacity-60 delay-300" style={{ animationDelay: "1.2s" }} />

        <div className="relative mx-auto max-w-6xl text-center">
          {/* badge */}
          <span className="animate-fade-in inline-flex rounded-full bg-primary-light px-4 py-1.5 text-[13px] font-bold text-primary delay-100">
            Buy, Sell, or Offer Services — Safely.
          </span>

          {/* headline */}
          <h1 className="animate-fade-up mx-auto mt-5 max-w-3xl text-[28px] font-extrabold leading-tight text-ink delay-150 sm:text-[40px] md:text-[52px]">
            Transact <span className="accent">Safely.</span>
            <br />
            Trust <span className="accent">EscrowGig.</span>
          </h1>

          {/* subtext */}
          <p className="animate-fade-up mx-auto mt-4 max-w-[440px] text-sm text-body delay-200 sm:text-base">
            With EscrowGig's milestone escrow system, freelancers and clients transact
            without risk — funds release only when work is done.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up mx-auto mt-6 flex flex-col gap-3 px-2 delay-300 sm:flex-row sm:justify-center sm:px-0">
            <Link to="/dashboard">
              <Button variant="secondary" className="w-full transition-transform hover:-translate-y-0.5 sm:w-auto">
                See how it works
              </Button>
            </Link>
            {address ? (
              <Link to="/create">
                <Button icon={<ArrowRight className="h-4 w-4" />} className="animate-pulse-glow w-full sm:w-auto">
                  Create Gig
                </Button>
              </Link>
            ) : (
              <Button
                isLoading={isConnecting}
                onClick={openModal}
                icon={<ArrowRight className="h-4 w-4" />}
                className="animate-pulse-glow w-full sm:w-auto"
              >
                Get Started Free
              </Button>
            )}
          </div>

          {/* partners */}
          <div className="animate-fade-in mx-auto mt-8 flex flex-col items-center gap-3 delay-500 sm:flex-row sm:justify-center">
            <p className="text-xs font-semibold text-muted">Key Partners / Built on</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {partners.map((partner, i) => (
                <span
                  key={partner}
                  className="animate-fade-in text-sm font-extrabold uppercase tracking-wide text-muted"
                  style={{ animationDelay: `${500 + i * 80}ms` }}
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>

          {/* Hero cards — desktop */}
          <div className="mx-auto mt-10 hidden max-w-5xl items-center gap-5 md:grid md:grid-cols-[1fr_210px_1fr] lg:mt-12">
            <GigCard role="Freelancer" side="left" delay={600} />
            <div className="card animate-scale-in mx-auto grid h-[210px] w-[210px] place-items-center bg-primary-light/60 p-5 delay-400">
              <div className="text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-primary">
                  <LockKeyhole className="h-8 w-8 animate-float text-primary" />
                </div>
                <p className="mt-5 text-3xl font-black text-primary">EscrowGig</p>
                <p className="text-xs font-bold text-body">Escrow operations</p>
              </div>
            </div>
            <GigCard role="Client" side="right" delay={700} />
          </div>

          {/* Single card — mobile */}
          <div className="animate-fade-up mt-8 flex justify-center delay-400 md:hidden">
            <GigCard role="Freelancer" side="left" />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white px-4 py-12 sm:py-16">
        <div
          ref={howRef}
          className="reveal mx-auto max-w-6xl"
        >
          <h2 className="text-center text-xl font-extrabold text-ink sm:text-2xl md:text-4xl">
            How <span className="accent">EscrowGig</span> Works
          </h2>
          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-3">
            {[
              [LockKeyhole, "Client Locks Funds", "Funds are deposited into a Soroban smart contract, not held by us.", 0],
              [CheckCircle2, "Freelancer Delivers", "Work is submitted milestone by milestone with proof attached.", 100],
              [CircleDollarSign, "Funds Released", "Client approves each milestone, funds transfer instantly.", 200],
            ].map(([Icon, title, copy, delay]) => {
              const StepIcon = Icon as typeof LockKeyhole;
              return (
                <article
                  className="card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(43,155,244,0.14)] sm:p-6"
                  key={title as string}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-light sm:h-14 sm:w-14">
                    <StepIcon className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-ink sm:mt-5 sm:text-[22px]">{title as string}</h3>
                  <p className="mt-2 text-sm text-body sm:mt-3 sm:text-base">{copy as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why choose ── */}
      <section className="bg-cloud px-4 py-12 sm:py-16">
        <div
          ref={whyRef}
          className="reveal mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"
        >
          <div>
            <h2 className="text-xl font-extrabold text-ink sm:text-2xl md:text-4xl">
              Why Choose <span className="accent">EscrowGig</span>
            </h2>
            <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4">
              {[
                "Zero platform custody — funds stay in smart contract",
                "Near-zero fees on Stellar blockchain",
                "Dispute resolution with neutral arbiter",
                "Works across borders, any currency via anchors",
              ].map((item, i) => (
                <p
                  className="flex items-start gap-3 text-sm text-body sm:text-base"
                  key={item}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary sm:h-5 sm:w-5" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </div>

          <article className="card p-5 transition-all duration-300 hover:shadow-[0_8px_28px_rgba(43,155,244,0.14)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Gig Detail</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink sm:text-[22px]">Website launch package</h3>
              </div>
              <Scale className="h-7 w-7 flex-none text-primary sm:h-8 sm:w-8" />
            </div>
            <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4">
              {[
                ["Brand and wireframes", "850 XLM", "Approved"],
                ["Production build", "1,150 XLM", "Pending"],
              ].map(([name, amount, status]) => (
                <div className="rounded-[12px] border border-border p-3 transition-colors hover:border-primary sm:p-4" key={name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink sm:text-base">{name}</p>
                      <p className="mt-1 text-xs text-body sm:text-sm">{amount}</p>
                    </div>
                    <StatusBadge status={status as MilestoneStatus} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary-light px-4 py-8 sm:py-10">
        <div
          ref={statsRef}
          className="reveal mx-auto grid max-w-5xl gap-4 text-center sm:gap-6 md:grid-cols-3"
        >
          {["1,200+ Gigs Created", "$340K+ Secured", "98% Satisfaction"].map((stat, i) => {
            const [value, ...label] = stat.split(" ");
            return (
              <div key={stat} style={{ transitionDelay: `${i * 100}ms` }}>
                <p className="text-3xl font-black text-primary sm:text-4xl">{value}</p>
                <p className="mt-1 text-sm font-semibold text-muted sm:text-base">{label.join(" ")}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary px-4 py-12 text-center text-white sm:py-14">
        <div ref={ctaRef} className="reveal">
          <h2 className="text-xl font-extrabold sm:text-2xl md:text-4xl">
            Start Your First Gig Today
          </h2>
          <p className="mt-3 text-sm text-white/85 sm:text-base">
            Free to use. No middlemen. Powered by Stellar.
          </p>
          <div className="mt-6 sm:mt-7">
            <Button
              variant="secondary"
              onClick={address ? undefined : openModal}
              className="border-white bg-white text-primary transition-transform hover:-translate-y-0.5 hover:bg-primary-light"
            >
              Connect Wallet &amp; Begin
            </Button>
          </div>
        </div>
      </section>

      {/* Test PostHog button — remove after verification */}
      <button
        onClick={() => posthog.capture("test_event", { source: "manual_test", timestamp: new Date().toISOString() })}
        style={{ position: "fixed", bottom: "16px", left: "16px", fontSize: "12px", opacity: 1, zIndex: 9999, padding: "8px 14px", background: "#2B9BF4", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", boxShadow: "0 4px 14px rgba(43,155,244,0.4)", fontWeight: 600 }}
      >
        Test PostHog
      </button>

      {/* ── Footer ── */}
      <footer className="bg-ink px-4 py-8 text-white sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8 md:grid-cols-[1.2fr_2fr]">
          <div className="flex items-center gap-2 text-lg font-black sm:text-xl">
            <ShieldCheck className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            EscrowGig
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6">
            {[
              ["Product", "Dashboard", "Create Gig", "Stats"],
              ["Resources", "Stellar", "Soroban", "Docs"],
              ["Company", "Contact", "Security", "Terms"],
            ].map(([title, ...links]) => (
              <div key={title}>
                <p className="text-sm font-bold sm:text-base">{title}</p>
                <div className="mt-2 grid gap-1.5 text-xs text-white/65 sm:mt-3 sm:gap-2 sm:text-sm">
                  {links.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/60 sm:mt-8 sm:text-sm">
          <p>© 2025 EscrowGig. Built on Stellar.</p>
          <span className="rounded-full bg-white/10 px-3 py-1 font-bold text-white">Stellar</span>
        </div>
      </footer>
    </div>
  );
};
