import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[error-boundary] Uncaught render error.", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#1a1a1a",
          background: "#faf8f5"
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", margin: 0, lineHeight: 1.5 }}>
          The Operations Center hit an unexpected error and couldn&apos;t finish loading. Your data is safe. Try
          reloading the page.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            cursor: "pointer",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.625rem 1.25rem",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#ffffff",
            background: "#c2410c"
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
