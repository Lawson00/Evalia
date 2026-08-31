"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
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
    </ProtectedRoute>
  );
}
