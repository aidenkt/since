import { DEMO_BANNER } from "../lib/demoMode";
import { useDemoUser } from "./DemoAuth";

/** Slim notice above every screen. In the document flow, so it does not cover the page. */
export default function DemoBanner() {
  const user = useDemoUser();
  return (
    <p className="demo-banner" role="note" data-demo-user={user.email}>
      {DEMO_BANNER}
    </p>
  );
}
