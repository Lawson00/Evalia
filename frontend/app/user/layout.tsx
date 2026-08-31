"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserShell } from "@/components/user/UserShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function UserLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/user/login" || pathname.startsWith("/user/login/");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <UserShell>{children}</UserShell>
    </ProtectedRoute>
  );
}
