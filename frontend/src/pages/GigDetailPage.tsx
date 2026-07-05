import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, Check, Send, ShieldQuestion } from "lucide-react";
import { Button } from "../components/Button";
import { FeedbackPrompt } from "../components/FeedbackPrompt";
import { StatusBadge } from "../components/StatusBadge";
import { TxConfirmation } from "../components/TxConfirmation";
import { useGigs } from "../hooks/useGigs";
import { useToast } from "../hooks/useToast";
import { useWallet } from "../hooks/useWallet";
import { explainError } from "../lib/errors";
import type { TxReceipt } from "../types";

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

  return (
    <section className="page">
      <Link className="text-sm font-semibold text-moss" to="/dashboard">Back to dashboard</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Gig #{gig.id}</h1>
          <p className="page-copy">{gig.totalFunded.toFixed(2)} XLM funded · role: {role}</p>
        </div>
        {role === "client" && gig.milestones.every((m) => m.status === "Pending") ? (
          <Button variant="danger" onClick={() => run("cancel", () => cancelGig(gig.id), "Gig cancelled")} isLoading={loadingKey === "cancel"}>
            Cancel gig
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4">
        {gig.milestones.map((milestone) => (
          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-soft" key={milestone.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-moss">Milestone {milestone.id + 1}</p>
                <h2 className="mt-1 text-xl font-bold text-ink">{milestone.description}</h2>
                <p className="mt-1 text-sm text-slate-600">{milestone.amount.toFixed(2)} XLM</p>
              </div>
              <StatusBadge status={milestone.status} />
            </div>

            {milestone.proof ? (
              <a className="mt-4 block break-all text-sm font-semibold text-moss" href={milestone.proof} target="_blank" rel="noreferrer">
                {milestone.proof}
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
                    Release to client
                  </Button>
                  <Button icon={<ShieldQuestion className="h-4 w-4" />} isLoading={loadingKey === `resolve-freelancer-${milestone.id}`} onClick={() => run(`resolve-freelancer-${milestone.id}`, () => resolveDispute(gig.id, milestone.id, gig.freelancer), "Resolved to freelancer")}>
                    Release to freelancer
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5"><TxConfirmation receipt={receipt} /></div>
      {completed ? <div className="mt-5"><FeedbackPrompt gigId={gig.id} /></div> : null}
    </section>
  );
};

