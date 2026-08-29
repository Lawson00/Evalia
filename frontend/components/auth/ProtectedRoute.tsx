"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"lecturer" | "student" | "admin">;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public login, signup, complete-profile and invitation paths that do NOT require authentication
  const publicAuthPaths = [
    "/admin/login",
    "/user/login",
    "/auth/admin",
    "/auth/candidate",
    "/auth/complete-profile",
    "/join",
  ];
  const isPublicAuthPath = publicAuthPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));

  useEffect(() => {
    if (isLoading || isPublicAuthPath) return;

    // 1. Unauthenticated Redirection
    if (!user) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("evalia_return_url", pathname);
      }
      router.push(`/?login=true&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Role Authorization Redirection
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        console.warn(`Unauthorized access attempt to ${pathname} by role ${user.role}`);
        if (user.role === "student") {
          router.push("/user");
        } else {
          router.push("/admin");
        }
      }
    }
  }, [user, isLoading, allowedRoles, router, pathname, isPublicAuthPath]);

  // Immediately render public login/signup pages without blocking overlay
  if (isPublicAuthPath) {
    return <>{children}</>;
  }

  // Loading Overlay Screen while verifying authentication status
  if (isLoading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-app)",
          color: "var(--text-primary)",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.4)",
          }}
        >
          <ShieldCheck size={28} color="#ffffff" />
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Verifying Authentication & Security Permissions…
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Evalia Human + AI Assessment Engine
          </p>
        </div>

        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-light)", marginTop: 8 }} />
      </div>
    );
  }

  return <>{children}</>;
}
