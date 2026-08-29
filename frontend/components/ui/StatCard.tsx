"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change
  icon?: React.ReactNode;
  accent?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, trend, icon, accent = "var(--accent)", loading }: StatCardProps) {
  if (loading) {
    return (
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        <div className="skeleton" style={{ height: 16, width: "60%" }} />
        <div className="skeleton" style={{ height: 32, width: "40%" }} />
        <div className="skeleton" style={{ height: 12, width: "50%" }} />
      </div>
    );
  }

  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = accent;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Accent glow */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
        borderRadius: "12px 12px 0 0",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{title}</span>
        {icon && (
          <div style={{
            color: accent,
            background: `${accent}18`,
            borderRadius: 8,
            padding: 8,
            display: "flex",
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
        {value}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {trend !== undefined && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 12,
            fontWeight: 600,
            color: isPositive ? "var(--status-active)" : "var(--status-danger)",
          }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? "+" : ""}{trend}%
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
