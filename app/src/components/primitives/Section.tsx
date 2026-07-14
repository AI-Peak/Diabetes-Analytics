import type { ReactNode } from "react";

export function Section({ label, source, children, className = "" }: { label: string; source?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`section-block ${className}`}>
      <div className="section-heading">
        <span className="section-kicker">{label}</span>
        {source ? <span className="section-source">source · {source}</span> : null}
      </div>
      {children}
    </section>
  );
}
