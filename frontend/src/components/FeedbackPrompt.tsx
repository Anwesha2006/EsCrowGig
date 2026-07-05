import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "./Button";
import { useGigs } from "../hooks/useGigs";
import { useWallet } from "../hooks/useWallet";

export const FeedbackPrompt = ({ gigId }: { gigId: string }) => {
  const { address } = useWallet();
  const { submitFeedback } = useGigs();
  const key = `escrowgig:completed-feedback:${gigId}`;
  const [hidden, setHidden] = useState(localStorage.getItem(key) === "yes");
  const [rating, setRating] = useState(5);
  const [improvement, setImprovement] = useState("");

  if (hidden || !address) {
    return null;
  }

  const submit = () => {
    submitFeedback({ wallet: address, rating, improvement });
    localStorage.setItem(key, "yes");
    setHidden(true);
  };

  return (
    <section className="rounded-md border border-gold/30 bg-white p-5">
      <p className="font-bold text-ink">How did this gig flow feel?</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} aria-label={`${value} stars`} onClick={() => setRating(value)}>
            <Star className={`h-6 w-6 ${value <= rating ? "fill-gold text-gold" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      <textarea
        className="input mt-3 min-h-24"
        placeholder="What would you improve?"
        value={improvement}
        onChange={(event) => setImprovement(event.target.value)}
      />
      <Button className="mt-3" onClick={submit}>Submit feedback</Button>
    </section>
  );
};
