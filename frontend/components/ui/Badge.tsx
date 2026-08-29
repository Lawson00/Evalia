"use client";

import React from "react";

type BadgeVariant = "active" | "warning" | "danger" | "info" | "muted" | "accent" | "draft" | "published" | "archived";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  active:    { bg: "var(--status-active-bg)",  color: "var(--status-active)"  },
  warning:   { bg: "var(--status-warn-bg)",    color: "var(--status-warn)"    },
  danger:    { bg: "var(--status-danger-bg)",  color: "var(--status-danger)"  },
  info:      { bg: "var(--status-info-bg)",    color: "var(--status-info)"    },
  muted:     { bg: "var(--status-muted-bg)",   color: "var(--status-muted)"   },
  accent:    { bg: "var(--accent-muted)",      color: "var(--accent-light)"   },
  draft:     { bg: "rgba(107,114,128,0.15)",   color: "#9CA3AF"               },
  published: { bg: "rgba(59,130,246,0.15)",    color: "#60A5FA"               },
  archived:  { bg: "rgba(107,114,128,0.15)",   color: "#6B7280"               },
};

export function Badge({ variant = "muted", children, dot = false, size = "md" }: BadgeProps) {
  const { bg, color } = variantStyles[variant];
  const padding = size === "sm" ? "2px 6px" : "3px 10px";
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding,
        borderRadius: 20,
        background: bg,
        color,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            animation: variant === "active" || variant === "published"
              ? "pulse-dot 1.8s ease-in-out infinite"
              : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
}
