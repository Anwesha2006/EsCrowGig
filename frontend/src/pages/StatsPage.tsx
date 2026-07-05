import { useGigs } from "../hooks/useGigs";

export const StatsPage = () => {
  const { gigs } = useGigs();
  const approved = gigs.flatMap((gig) => gig.milestones).filter((milestone) => milestone.status === "Approved");
  const released = approved.reduce((sum, milestone) => sum + milestone.amount, 0);

  return (
    <section className="page">
      <h1 className="page-title">Stats</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="stat"><span>Total gigs</span><strong>{gigs.length}</strong></article>
        <article className="stat"><span>Milestones approved</span><strong>{approved.length}</strong></article>
        <article className="stat"><span>XLM released</span><strong>{released.toFixed(2)}</strong></article>
      </div>
    </section>
  );
};

