import { useGigs } from "../hooks/useGigs";

export const StatsPage = () => {
  const { gigs } = useGigs();
  const approved = gigs.flatMap((g) => g.milestones).filter((m) => m.status === "Approved");
  const released = approved.reduce((sum, m) => sum + m.amount, 0);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <h1 className="page-title">Stats</h1>
      <p className="page-copy mt-1 text-sm sm:text-base">
        A quick snapshot of gig activity and released milestone value.
      </p>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        <article className="stat">
          <span>Total gigs</span>
          <strong>{gigs.length}</strong>
        </article>
        <article className="stat">
          <span>Milestones approved</span>
          <strong>{approved.length}</strong>
        </article>
        <article className="stat">
          <span>XLM released</span>
          <strong>{released.toFixed(2)}</strong>
        </article>
      </div>
    </section>
  );
};
