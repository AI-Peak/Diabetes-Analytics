import type { ReactNode } from "react";
import { Chip } from "./Chip";

export function PageHead({
  eyebrow,
  title,
  subtitle,
  meta = [],
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: ReactNode[];
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {meta.length ? <div className="meta-row">{meta.map((item, index) => <Chip key={index}>{item}</Chip>)}</div> : null}
    </header>
  );
}
