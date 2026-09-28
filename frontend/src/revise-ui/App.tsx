"use client";
import { useEffect, useState } from "react";
import Shell from "./components/Shell";
import { EmptyState } from "./components/ui";
import { HomePage, ReviewPage, TeachPage } from "./pages/core";
import { MemoryPage, TimelinePage } from "./pages/memory";
import { PairProgrammerPage, ReportPage, SettingsPage, StandardsPage } from "./pages/remaining";

export default function App() {
  const [path, setPath] = useState("/");
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  let page = <EmptyState title="Page not found" detail="This ReVise workspace route does not exist."/>;
  if (path === "/") page = <HomePage/>;
  if (path === "/github-review") page = <ReviewPage mode="github"/>;
  if (path === "/analyze") page = <ReviewPage mode="code"/>;
  if (path === "/teach") page = <TeachPage/>;
  if (path === "/memory") page = <MemoryPage/>;
  if (path === "/timeline") page = <TimelinePage/>;
  if (path === "/pair-programmer") page = <PairProgrammerPage/>;
  if (path.startsWith("/report/")) page = <ReportPage/>;
  if (path === "/standards") page = <StandardsPage/>;
  if (path === "/settings") page = <SettingsPage/>;
  return <Shell path={path}><div key={path} className="page-transition">{page}</div></Shell>;
}

