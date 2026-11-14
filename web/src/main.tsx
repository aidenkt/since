import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AuthGate from "./components/AuthGate";
import DemoBanner from "./components/DemoBanner";
import { demoMode } from "./lib/demoMode";
import "./styles.css";

function Shell({ children }: { children: ReactNode }) {
  if (!demoMode) return children;
  return (
    <div className="demo-shell">
      <DemoBanner />
      <div className="demo-shell-body">{children}</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <Shell>
        <App />
      </Shell>
    </AuthGate>
  </StrictMode>,
);
