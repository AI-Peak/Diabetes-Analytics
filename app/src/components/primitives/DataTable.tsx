import type { ReactNode } from "react";

export type TableColumn<T> = {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowClassName,
  onRowClick,
  selectedRowKey,
  stickyHeader = false,
  caption,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  stickyHeader?: boolean;
  caption: string;
}) {
  return (
    <div className="table-wrap">
      <table className={`data-table${stickyHeader ? " sticky-head" : ""}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{columns.map((column) => <th className={column.align === "right" ? "align-right" : undefined} key={column.id} scope="col">{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const className = [rowClassName?.(row), onRowClick ? "interactive-row" : "", selectedRowKey === key ? "selected-row" : ""].filter(Boolean).join(" ");
            return (
            <tr
              className={className || undefined}
              key={key}
              aria-selected={selectedRowKey === key || undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(event) => {
                if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((column) => (
                <td className={column.align === "right" ? "align-right num" : undefined} key={column.id}>{column.render(row)}</td>
              ))}
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}
