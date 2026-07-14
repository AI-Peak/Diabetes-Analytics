const intFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function fmtInt(value: number): string {
  return intFormatter.format(value);
}

export function fmtPct(value: number, dp = 1): string {
  return `${(value * 100).toFixed(dp)}%`;
}

export function fmtFloat(value: number, dp = 3): string {
  return value.toFixed(dp);
}

export function fmtSigned(value: number, dp = 3): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(dp)}`;
}
