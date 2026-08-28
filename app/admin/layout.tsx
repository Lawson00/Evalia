import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";

export const metadata: Metadata = {
  title: "Lecturer Hub – Evalia",
  description: "Evalia lecturer administration and assignment portal",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <TopBar />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "var(--bg-base)",
            padding: "28px 32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
