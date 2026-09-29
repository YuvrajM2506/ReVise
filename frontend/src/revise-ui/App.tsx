"use client";
import { Component, useEffect, useState, type ReactNode } from "react";
import Shell from "./components/Shell";
import LandingPage from "./pages/LandingPage";
import { Button, EmptyState, ErrorState } from "./components/ui";
import { HomePage, ReviewPage, TeachPage } from "./pages/core";
import { MemoryPage, TimelinePage } from "./pages/memory";
import { PairProgrammerPage, ReportPage, SettingsPage, StandardsPage } from "./pages/remaining";
import PricingPage from "@/app/pricing/page";

/** Renders the empty-state card as a link-button via Shell's navigate. */
function NotFoundState() {
  return (
    <EmptyState
      title="Page not found"
      detail="This ReVise workspace route does not exist."
      action={<Button variant="secondary" onClick={() => { window.history.pushState({}, "", "/dashboard"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Go to dashboard</Button>}
    />
  );
}

interface ErrorBoundaryState { error: Error | null }

/** A render crash must not blank the whole app; report it and offer a retry. */
class PageErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This page crashed."
          detail={this.state.error.message || "An unexpected rendering error occurred."}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [path, setPath] = useState("/");
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  if (path === "/") return <LandingPage/>;
  let page = <NotFoundState/>;
  if (path === "/dashboard") page = <HomePage/>;
  if (path === "/github-review") page = <ReviewPage mode="github"/>;
  if (path === "/analyze") page = <ReviewPage mode="code"/>;
  if (path === "/teach") page = <TeachPage/>;
  if (path === "/memory") page = <MemoryPage/>;
  if (path === "/timeline") page = <TimelinePage/>;
  if (path === "/pair-programmer") page = <PairProgrammerPage/>;
  if (path.startsWith("/report/")) page = <ReportPage/>;
  if (path === "/standards") page = <StandardsPage/>;
  if (path === "/settings") page = <SettingsPage/>;
  if (path === "/pricing") page = <PricingPage/>;
  return <Shell path={path}><PageErrorBoundary key={path}><div className="page-transition">{page}</div></PageErrorBoundary></Shell>;
}
