import type { ReactNode } from "react";

export function ChartCard({
  title,
  subtitle,
  source,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  source: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`chart-card ${className}`}>
      <header className="chart-card-header">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
      <footer className="chart-card-footer card-source">source · {source}</footer>
    </article>
  );
}
