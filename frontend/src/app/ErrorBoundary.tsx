import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
          <section className="max-w-xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">The chat screen could not load</h1>
            <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
            <button
              className="mt-4 rounded-md bg-chat-accent px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                this.setState({ error: undefined });
                window.location.assign("/login");
              }}
            >
              Back to login
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
