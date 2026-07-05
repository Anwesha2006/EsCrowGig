import { FormEvent, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "../components/Button";
import { useGigs } from "../hooks/useGigs";

export const AdminPage = () => {
  const { feedback } = useGigs();
  const [password, setPassword] = useState("");
  const [allowed, setAllowed] = useState(sessionStorage.getItem("escrowgig:admin") === "yes");
  const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "escrowgig-admin";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password === adminPassword) {
      sessionStorage.setItem("escrowgig:admin", "yes");
      setAllowed(true);
    }
  };

  if (!allowed) {
    return (
      <section className="page max-w-md">
        <h1 className="page-title">Admin</h1>
        <form className="card mt-6 grid gap-3 p-6" onSubmit={submit}>
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button icon={<Lock className="h-4 w-4" />}>Unlock</Button>
        </form>
      </section>
    );
  }

  return (
    <section className="page">
      <h1 className="page-title">Feedback</h1>
      <div className="card mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-primary-light text-ink">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Name</th>
              <th className="p-3">Use case</th>
              <th className="p-3">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((entry) => (
              <tr className="border-t border-border" key={entry.id}>
                <td className="p-3">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="max-w-xs break-all p-3">{entry.wallet}</td>
                <td className="p-3">{entry.rating ?? "-"}</td>
                <td className="p-3">{entry.name ?? "-"}</td>
                <td className="p-3">{entry.useCase ?? "-"}</td>
                <td className="p-3">{entry.improvement ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
