import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle errors from anywhere in the tree so a task crash
 * shows a recover card instead of a blank screen. Deliberately dependency-free
 * (no i18n / context) so it still renders if those are what broke.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="screen">
        <h2>Something went wrong / エラーが発生しました</h2>
        <p className="muted">{this.state.error.message}</p>
        <button className="primary" onClick={() => location.reload()}>
          Reload / 再読み込み
        </button>
      </div>
    );
  }
}
