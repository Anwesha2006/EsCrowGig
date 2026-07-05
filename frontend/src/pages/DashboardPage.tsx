import { Link } from "react-router-dom";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { useGigs } from "../hooks/useGigs";
import { useWallet } from "../hooks/useWallet";

export const DashboardPage = () => {
  const { gigs } = useGigs();
  const { address } = useWallet();
  const visible = address
    ? gigs.filter((gig) => [gig.client, gig.freelancer, gig.arbiter].includes(address))
    : gigs;

  return (
    <section className="page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-copy">Gigs where the connected wallet is client, freelancer, or arbiter.</p>
        </div>
        <Link to="/create"><Button icon={<Plus className="h-4 w-4" />}>New gig</Button></Link>
      </div>
      <div className="mt-6 grid gap-4">
        {visible.length === 0 ? (
          <div className="empty">No gigs yet. Create a two-milestone testnet gig to start the flow.</div>
        ) : (
          visible.map((gig) => (
            <Link className="rounded-md border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5" to={`/gig/${gig.id}`} key={gig.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-moss">Gig #{gig.id}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{gig.totalFunded.toFixed(2)} XLM funded</h2>
                  <p className="mt-2 break-all text-sm text-slate-600">Freelancer {gig.freelancer}</p>
                </div>
                <ExternalLink className="h-5 w-5 text-slate-400" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {gig.milestones.map((milestone) => <StatusBadge key={milestone.id} status={milestone.status} />)}
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
};

