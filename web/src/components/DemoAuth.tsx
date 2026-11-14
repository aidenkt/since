import { createContext, useContext, type ReactNode } from "react";
import { DEMO_USER } from "../lib/demoMode";

export type DemoUser = {
  email: string;
  name: string;
  isLoaded: true;
  isSignedIn: true;
};

const demoUser: DemoUser = { ...DEMO_USER, isLoaded: true, isSignedIn: true };

const DemoUserContext = createContext<DemoUser>(demoUser);

/** Stands in for ClerkProvider. The visitor is anonymous and already "signed in". */
export function DemoAuthProvider({ children }: { children: ReactNode }) {
  return <DemoUserContext.Provider value={demoUser}>{children}</DemoUserContext.Provider>;
}

/** Anonymous demonstration user: loaded, signed in, and not a Clerk session. */
export function useDemoUser(): DemoUser {
  return useContext(DemoUserContext);
}
