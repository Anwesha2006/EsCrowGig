import { Component, type ErrorInfo, type ReactNode } from "react";

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("EscrowGig render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-cloud p-4">
          <section className="w-full max-w-xl rounded-md border border-red-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-bold uppercase text-coral">EscrowGig could not render</p>
            <h1 className="mt-2 text-2xl font-black text-ink">Frontend runtime error</h1>
            <p className="mt-3 text-sm text-slate-600">
              Refresh the page after the latest fix. If this remains visible, the message below is the useful clue.
            </p>
            <pre className="mt-4 max-h-56 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">
              {this.state.error.message}
            </pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
