"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = "No records found.",
  loading = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {columns.map(col => (
              <th
                key={String(col.key)}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  cursor: col.sortable ? "pointer" : "default",
                  userSelect: "none",
                  width: col.width,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {col.header}
                  {col.sortable && (
                    <span style={{ display: "flex", flexDirection: "column", color: sortKey === String(col.key) ? "var(--accent-light)" : "var(--text-muted)" }}>
                      <ChevronUp size={10} style={{ marginBottom: -3 }} />
                      <ChevronDown size={10} />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {columns.map(col => (
                  <td key={String(col.key)} style={{ padding: "14px 16px" }}>
                    <div className="skeleton" style={{ height: 14, width: "70%" }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map(row => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  cursor: onRowClick ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => {
                  if (onRowClick) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {columns.map(col => (
                  <td key={String(col.key)} style={{ padding: "12px 16px", color: "var(--text-primary)" }}>
                    {col.render
                      ? col.render(row)
                      : String(row[String(col.key)] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
