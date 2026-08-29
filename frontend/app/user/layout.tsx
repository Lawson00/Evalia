import type { ReactNode } from "react";
import { UserShell } from "@/components/user/UserShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <UserShell>{children}</UserShell>
    </ProtectedRoute>
  );
}
