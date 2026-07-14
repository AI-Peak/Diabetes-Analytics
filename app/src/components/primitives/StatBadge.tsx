export function StatBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "best" | "moderate" | "risk" }) {
  return <span className={`stat-badge ${tone}`}>{label}</span>;
}
