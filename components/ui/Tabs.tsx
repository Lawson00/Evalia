"use client";

import React, { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  children: (activeTab: string) => React.ReactNode;
}

export function Tabs({ tabs, defaultTab, onChange, children }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div>
      <div style={{
        display: "flex",
        gap: 2,
        borderBottom: "1px solid var(--border)",
        marginBottom: 24,
      }}>
        {tabs.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {children(active)}
    </div>
  );
}
