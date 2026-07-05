import { useGigs } from "../hooks/useGigs";

export const StatsPage = () => {
  const { gigs } = useGigs();
  const approved = gigs.flatMap((g) => g.milestones).filter((m) => m.status === "Approved");
  const released = approved.reduce((sum, m) => sum + m.amount, 0);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <div className="animate-fade-up">
        <h1 className="page-title">Stats</h1>
        <p className="page-copy mt-1 text-sm sm:text-base">
          A quick snapshot of gig activity and released milestone value.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "Total gigs", value: gigs.length },
          { label: "Milestones approved", value: approved.length },
          { label: "XLM released", value: released.toFixed(2) },
        ].map((s, i) => (
          <article
            key={s.label}
            className="stat animate-fade-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
};
