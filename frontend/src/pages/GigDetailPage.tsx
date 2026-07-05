import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Check, ExternalLink, Send, ShieldQuestion } from "lucide-react";
import { Button } from "../components/Button";
import { FeedbackPrompt } from "../components/FeedbackPrompt";
import { StatusBadge } from "../components/StatusBadge";
import { TxConfirmation } from "../components/TxConfirmation";
import { useGigs } from "../hooks/useGigs";
import { useToast } from "../hooks/useToast";
import { useWallet } from "../hooks/useWallet";
import { explainError } from "../lib/errors";
import { stellarExpertTxUrl } from "../lib/stellar";
import type { MilestoneStatus, TxReceipt } from "../types";

const short = (value: string) => `${value.slice(0, 8)}...${value.slice(-6)}`;

export const GigDetailPage = () => {
  const { gigId = "" } = useParams();
  const { gigs, submitMilestone, approveMilestone, raiseDispute, resolveDispute, cancelGig } = useGigs();
  const { address } = useWallet();
  const { pushToast } = useToast();
  const gig = gigs.find((item) => item.id === gigId);
  const [proof, setProof] = useState<Record<number, string>>({});
  const [loadingKey, setLoadingKey] = useState("");
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);

  const role = useMemo(() => {
    if (!gig || !address) return "viewer";
    if (address === gig.client) return "client";
    if (address === gig.freelancer) return "freelancer";
    if (address === gig.arbiter) return "arbiter";
    return "viewer";
  }, [address, gig]);

  if (!gig) {
    return (
      <section className="page">
        <div className="empty">Gig not found. Return to the dashboard and choose another gig.</div>
      </section>
    );
  }

  const run = async (key: string, action: () => Promise<TxReceipt>, success: string) => {
    setLoadingKey(key);
    try {
      const tx = await action();
      setReceipt(tx);
      pushToast({ type: "success", title: success });
    } catch (error) {
      pushToast({ type: "error", title: "Transaction failed", message: explainError(error) });
    } finally {
      setLoadingKey("");
    }
  };

  const completed = gig.milestones.every((milestone) => milestone.status === "Approved");
  const gigStatus: MilestoneStatus = gig.isActive ? (completed ? "Approved" : "Pending") : "Disputed";

  return (
    <section className="page">
      <div className="text-sm font-semibold text-body">
        <Link className="text-primary hover:text-primary-dark" to="/dashboard">Dashboard</Link>
        <span className="mx-2 text-muted">/</span>
        <span>Gig #{gig.id}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Gig #{gig.id}</h1>
          <p className="page-copy">{gig.totalFunded.toFixed(2)} XLM funded · role: {role}</p>
        </div>
        {role === "client" && gig.milestones.every((m) => m.status === "Pending") ? (
          <Button variant="danger" onClick={() => run("cancel", () => cancelGig(gig.id), "Gig cancelled")} isLoading={loadingKey === "cancel"}>
            Cancel Gig
          </Button>
        ) : null}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="card h-fit p-6">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Gig Info</p>
          <div className="mt-5 grid gap-4 text-sm">
            {[
              ["Client", gig.client],
              ["Freelancer", gig.freelancer],
              ["Arbiter", gig.arbiter]
            ].map(([label, value]) => (
              <div key={label}>
                <p className="font-bold text-muted">{label}</p>
                <p className="mt-1 break-all font-semibold text-ink">{short(value)}</p>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <p className="font-bold text-muted">Total funded</p>
                <p className="mt-1 text-xl font-black text-primary">{gig.totalFunded.toFixed(2)} XLM</p>
              </div>
              <div>
                <p className="font-bold text-muted">Status</p>
                <div className="mt-2"><StatusBadge status={gigStatus} /></div>
              </div>
            </div>
          </div>
        </aside>

        <div className="grid gap-4">
          {gig.milestones.map((milestone) => (
            <article className="card p-5" key={milestone.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-primary">Milestone {milestone.id + 1}</p>
                  <h2 className="mt-1 text-xl font-extrabold text-ink">{milestone.description}</h2>
                  <p className="mt-1 text-sm font-semibold text-body">{milestone.amount.toFixed(2)} XLM</p>
                </div>
                <StatusBadge status={milestone.status} />
              </div>

              {milestone.proof ? (
                <a className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-primary" href={milestone.proof} target="_blank" rel="noreferrer">
                  Proof URL <ExternalLink className="h-4 w-4 flex-none" />
                </a>
              ) : null}

              {role === "freelancer" && milestone.status === "Pending" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input className="input" placeholder="Proof URL" value={proof[milestone.id] ?? ""} onChange={(e) => setProof({ ...proof, [milestone.id]: e.target.value })} />
                  <Button
                    icon={<Send className="h-4 w-4" />}
                    isLoading={loadingKey === `submit-${milestone.id}`}
                    onClick={() => run(`submit-${milestone.id}`, () => submitMilestone(gig.id, milestone.id, proof[milestone.id] ?? ""), "Milestone submitted")}
                  >
                    Submit
                  </Button>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {role === "client" && milestone.status === "Submitted" ? (
                  <Button icon={<Check className="h-4 w-4" />} isLoading={loadingKey === `approve-${milestone.id}`} onClick={() => run(`approve-${milestone.id}`, () => approveMilestone(gig.id, milestone.id), "Milestone approved")}>
                    Approve
                  </Button>
                ) : null}
                {(role === "client" || role === "freelancer") && milestone.status !== "Approved" && milestone.status !== "Disputed" ? (
                  <Button variant="secondary" icon={<AlertTriangle className="h-4 w-4" />} isLoading={loadingKey === `dispute-${milestone.id}`} onClick={() => run(`dispute-${milestone.id}`, () => raiseDispute(gig.id, milestone.id), "Dispute raised")}>
                    Dispute
                  </Button>
                ) : null}
                {role === "arbiter" && milestone.status === "Disputed" ? (
                  <>
                    <Button variant="secondary" icon={<ShieldQuestion className="h-4 w-4" />} isLoading={loadingKey === `resolve-client-${milestone.id}`} onClick={() => run(`resolve-client-${milestone.id}`, () => resolveDispute(gig.id, milestone.id, gig.client), "Resolved to client")}>
                      Resolve to Client
                    </Button>
                    <Button icon={<ShieldQuestion className="h-4 w-4" />} isLoading={loadingKey === `resolve-freelancer-${milestone.id}`} onClick={() => run(`resolve-freelancer-${milestone.id}`, () => resolveDispute(gig.id, milestone.id, gig.freelancer), "Resolved to freelancer")}>
                      Resolve to Freelancer
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      <section className="card mt-6 p-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Transaction History</p>
        {gig.lastTxHash ? (
          <a className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-border p-4 text-sm" href={stellarExpertTxUrl(gig.lastTxHash)} target="_blank" rel="noreferrer">
            <span className="break-all font-semibold text-ink">{gig.lastTxHash}</span>
            <span className="inline-flex items-center gap-2 font-bold text-primary">View on Stellar Expert <ExternalLink className="h-4 w-4" /></span>
          </a>
        ) : (
          <p className="mt-4 text-sm text-muted">No transaction hash recorded yet.</p>
        )}
      </section>

      <div className="mt-5"><TxConfirmation receipt={receipt} /></div>
      {completed ? <div className="mt-5"><FeedbackPrompt gigId={gig.id} /></div> : null}
    </section>
  );
};
