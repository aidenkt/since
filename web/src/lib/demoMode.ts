/** Public demonstration build. On unless VITE_DEMO_MODE is exactly "0".
 *  This branch defaults to on: Clerk is not loaded, and the workbook database
 *  is the in-memory store in demoStore.ts. Set VITE_DEMO_MODE=0 (and the
 *  Base44 secret DEMO_MODE=0) to restore sign-in and Base44. */
export const demoMode = import.meta.env.VITE_DEMO_MODE !== "0";

/** Anonymous visitor. example.com is reserved and is not a real mailbox. */
export const DEMO_USER = {
  email: "visitor@example.com",
  name: "Demo Visitor",
} as const;

export const DEMO_BANNER = "Demo: sign-in and the database are disabled for demonstration purposes.";
