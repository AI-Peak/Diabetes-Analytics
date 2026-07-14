import type { ReactNode } from "react";

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "risk" | "teal" }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
