"use client";

import { DataTable, RadioGroup, StatBadge, type TableColumn } from "@/components/primitives";
import type { Rq1Data } from "@/lib/data/schemas";
import { fmtFloat } from "@/lib/format";
import { useUrlState } from "@/lib/use-url-state";

type AdjustedRow = Rq1Data["adjusted"][number];
type TableView = "top5" | "all" | "hidden";

const viewOptions: { value: TableView; label: string }[] = [
  { value: "top5", label: "Top 5" },
  { value: "all", label: "All 21" },
  { value: "hidden", label: "Hide table" },
];

const columns: TableColumn<AdjustedRow>[] = [
  { id: "variable", header: "Variable", render: (row) => <><strong>{row.variable}</strong><br /><span className="card-source">{row.label}</span></> },
  { id: "or", header: "Adjusted OR", align: "right", render: (row) => fmtFloat(row.oddsRatio, 3) },
  { id: "ci", header: "95% CI", align: "right", render: (row) => `${fmtFloat(row.ciLower, 3)} - ${fmtFloat(row.ciUpper, 3)}` },
  { id: "vif", header: "VIF", align: "right", render: (row) => fmtFloat(row.vif, 2) },
  { id: "holm", header: "Holm p", align: "right", render: (row) => row.holmP === 0 ? "<1e-300" : row.holmP.toExponential(2) },
  { id: "sig", header: "After Holm", render: (row) => <StatBadge label={row.significant ? "Significant" : "Not significant"} tone={row.significant ? "moderate" : "neutral"} /> },
];

export function AdjustedAssociationTable({ rows }: { rows: AdjustedRow[] }) {
  const [view, setView] = useUrlState<TableView>("adjusted", "top5", (value) => viewOptions.some((option) => option.value === value));
  const visibleRows = view === "all" ? rows : rows.slice(0, 5);
  const top = rows[0];
  const maxVif = rows.toSorted((a, b) => b.vif - a.vif)[0];

  return (
    <div className="adjusted-table-view">
      <div className="control-row">
        <RadioGroup label="Table view" value={view} options={viewOptions} onChange={(value) => setView(value as TableView)} />
      </div>

      {view === "hidden" ? (
        <div className="metric-strip metric-strip-thirds" aria-live="polite">
          <div className="metric-mini"><span>Top adjusted OR</span><strong>{top.variable} {top.oddsRatio.toFixed(3)}</strong></div>
          <div className="metric-mini"><span>Predictors analyzed</span><strong>{rows.length}</strong></div>
          <div className="metric-mini"><span>Maximum VIF</span><strong>{maxVif.vif.toFixed(2)}</strong></div>
        </div>
      ) : (
        <DataTable
          rows={visibleRows}
          columns={columns}
          rowKey={(row) => row.variable}
          caption={view === "top5"
            ? "Top five adjusted odds ratios from the 21-predictor model"
            : "Adjusted odds ratios, 95% confidence intervals and variance inflation factors for all 21 predictors"}
        />
      )}

      <p className="interaction-hint">
        Highest variance inflation factor is <strong>{maxVif.vif.toFixed(2)}</strong> ({maxVif.variable}), below the
        conventional threshold of 5, so no predictor is redundant enough to make these adjusted estimates unstable.
        Confidence intervals and Holm-adjusted p-values describe the analyzed sample only, not causal effects or
        weighted national estimates.
      </p>
    </div>
  );
}
