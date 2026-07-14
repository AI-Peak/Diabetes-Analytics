import type { ReactNode } from "react";

export function Callout({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "warn" }) {
  return (
    <div className={`callout callout-${variant}`} role="note">
      <span className="callout-mark" aria-hidden="true">i</span>
      <div>{children}</div>
    </div>
  );
}
