import { Link } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, BarChart3, Check, CircleDollarSign, Clock3,
  Coins, Handshake, Layers3, LockKeyhole, MessageCircle, ShieldCheck,
  Sparkles, UsersRound, WalletCards
} from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useReveal } from "../hooks/useReveal";

const ButtonLink = ({ to, children, outline = false }: { to: string; children: React.ReactNode; outline?: boolean }) => (
  <Link to={to} className={`landing-button ${outline ? "landing-button--outline" : ""}`}>
    {children} <ArrowRight className="h-4 w-4" />
  </Link>
);

export const LandingPage = () => {
  const { address, openModal, isConnecting } = useWallet();
  const processRef = useReveal() as React.RefObject<HTMLDivElement>;
  const proofRef = useReveal() as React.RefObject<HTMLDivElement>;
  const statsRef = useReveal() as React.RefObject<HTMLDivElement>;

  return (
    <div className="landing-shell">
      <section className="landing-hero landing-grid px-4 pb-20 pt-16 sm:pt-24">
        <div className="landing-orb landing-orb--one" />
        <div className="landing-orb landing-orb--two" />
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="landing-eyebrow animate-fade-in"><Sparkles className="h-3.5 w-3.5" /> TRUSTLESS GIG ESCROW <Sparkles className="h-3.5 w-3.5" /></p>
          <h1 className="landing-display animate-fade-up mx-auto mt-8 max-w-5xl delay-100">
            Secure every deal.<br />
            <span>Build without doubt.</span>
          </h1>
          <p className="landing-lede animate-fade-up mx-auto mt-6 max-w-2xl delay-200">
            EscrowGig makes freelance work safer with milestone-based smart contract escrow on Stellar. Funds move only when the work is approved.
          </p>
          <div className="animate-fade-up mt-8 flex flex-col justify-center gap-3 sm:flex-row delay-300">
            {address ? <ButtonLink to="/create">Create a gig</ButtonLink> : (
              <button className="landing-button" onClick={openModal} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Get started"} <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <ButtonLink to="/dashboard" outline>Explore dashboard</ButtonLink>
          </div>

          <div className="landing-trust-row animate-fade-in delay-500">
            <span>BUILT WITH</span><span className="landing-rule" />
            <b>STELLAR</b><b>SOROBAN</b><b>FREIGHTER</b><span className="landing-rule" />
          </div>

          <div className="landing-deal-preview animate-fade-up delay-500">
            <div className="landing-preview-card landing-preview-card--left">
              <span className="landing-card-label">CLIENT DEPOSIT</span>
              <strong>2,000 XLM</strong>
              <small><LockKeyhole className="h-3.5 w-3.5" /> Locked in contract</small>
            </div>
            <div className="landing-lock"><ShieldCheck className="h-10 w-10" /><span>ESCROW<br />PROTECTED</span></div>
            <div className="landing-preview-card landing-preview-card--right">
              <span className="landing-card-label">MILESTONE 02</span>
              <strong>Ready to release</strong>
              <small><BadgeCheck className="h-3.5 w-3.5" /> Delivery verified</small>
            </div>
          </div>
        </div>
      </section>

      <section ref={processRef} className="landing-section reveal px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="landing-eyebrow"><Layers3 className="h-3.5 w-3.5" /> HOW ESCROWGIG WORKS</p>
            <h2 className="landing-heading mx-auto mt-6 max-w-4xl">The agreement is simple.<br /><span>The protection is built in.</span></h2>
          </div>
          <div className="landing-steps mt-14">
            {[
              [WalletCards, "Fund the deal", "A client locks the agreed amount into a transparent smart contract."],
              [Clock3, "Deliver in milestones", "Work is shared in stages, each with a clear approval point."],
              [CircleDollarSign, "Release with confidence", "Approved work releases funds directly to the freelancer."],
            ].map(([Icon, title, copy], index) => {
              const StepIcon = Icon as typeof WalletCards;
              return <article className="landing-step" key={title as string}>
                <span className="landing-step-number">0{index + 1}</span>
                <div className="landing-step-icon"><StepIcon className="h-6 w-6" /></div>
                <h3>{title as string}</h3><p>{copy as string}</p>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section ref={proofRef} className="landing-section landing-section--soft reveal px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="landing-eyebrow">ON-CHAIN PEACE OF MIND</p>
            <h2 className="landing-heading mt-6">Your work deserves more than a promise.</h2>
            <p className="landing-copy mt-6">Keep every project moving with shared milestones, visible approvals, and funds no one can touch until the terms are met.</p>
            <ButtonLink to="/create">Create secure gig</ButtonLink>
          </div>
          <div className="landing-contract-card">
            <div className="landing-contract-top"><span><Handshake className="h-5 w-5" /> WEBSITE REDESIGN</span><span className="landing-live-dot">ACTIVE</span></div>
            <div className="landing-amount"><span>ESCROWED VALUE</span><strong>2,400 <em>XLM</em></strong></div>
            {[["01", "Discovery & wireframes", "Approved"], ["02", "Interface design", "In review"], ["03", "Final handoff", "Waiting"]].map(([number, title, state], index) => (
              <div className="landing-milestone" key={title}>
                <span>{number}</span><div><b>{title}</b><small>{index === 0 ? "800 XLM released" : index === 1 ? "800 XLM secured" : "800 XLM secured"}</small></div>
                {index === 0 ? <Check className="h-5 w-5 text-[#d7f52b]" /> : <span className="landing-status">{state}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={statsRef} className="landing-section reveal px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><p className="landing-eyebrow">OUR NETWORK SO FAR</p><h2 className="landing-heading mt-6">A safer standard for independent work.</h2><p className="landing-copy mt-5">Made for clients and freelancers who value clarity, ownership, and getting great work over the line.</p></div>
          <div className="landing-stat-list">
            {[['1,200+', 'GIGS CREATED'], ['$340K+', 'VALUE SECURED'], ['98%', 'SUCCESSFUL COMPLETIONS']].map(([value, label], i) => <div className="landing-stat" key={label}><span>{label}</span><strong className={i === 1 ? 'landing-stat--lime' : ''}>{value}</strong></div>)}
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta px-4 py-20 text-center sm:py-28">
        <div className="mx-auto max-w-3xl"><p className="landing-eyebrow">START WITH TRUST</p><h2 className="landing-heading mt-6">Turn your next agreement into a guarantee.</h2><p className="landing-copy mx-auto mt-5">No middlemen holding your money. Just clear milestones and contracts that do exactly what they say.</p><div className="mt-8 flex justify-center">{address ? <ButtonLink to="/create">Create your first gig</ButtonLink> : <button onClick={openModal} className="landing-button">Connect wallet <ArrowRight className="h-4 w-4" /></button>}</div></div>
      </section>

      <footer className="landing-footer px-4 py-10"><div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-xl font-bold text-white"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#d7f52b] text-[#101211]"><ShieldCheck className="h-5 w-5" /></span>EscrowGig</div><p className="mt-3 max-w-xs text-sm text-white/55">Secure milestone payments for independent work, powered by Stellar.</p></div><div className="flex gap-6 text-sm text-white/65"><Link to="/dashboard">Dashboard</Link><Link to="/create">Create Gig</Link><Link to="/stats">Stats</Link></div><p className="text-xs text-white/40">© 2026 EscrowGig</p></div></footer>
    </div>
  );
};
