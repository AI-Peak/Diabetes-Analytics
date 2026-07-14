export function KpiCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "accent" | "risk";
}) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value num">{value}</div>
      <p className="kpi-note">{note}</p>
    </article>
  );
}
