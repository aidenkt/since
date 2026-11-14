import type { ReactNode } from "react";
import { demoMode } from "../lib/demoMode";
import { DemoAuthProvider } from "./DemoAuth";

// Loaded only when the demonstration switch is off, so a demo build never
// evaluates @clerk/react and never contacts Clerk.
const clerk = demoMode ? null : await import("./ClerkAuth");

/** Clerk, or an anonymous visitor when the demonstration switch is on. */
export default function AuthGate({ children }: { children: ReactNode }) {
  if (!clerk) return <DemoAuthProvider>{children}</DemoAuthProvider>;
  const Gate = clerk.default;
  return <Gate>{children}</Gate>;
}

/** Account menu for the top bar. Nothing in the demonstration build (no Clerk). */
export function Account() {
  if (!clerk) return null;
  return <clerk.Account />;
}
