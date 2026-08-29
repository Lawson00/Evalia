"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  role: "lecturer" | "student" | "admin";
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  indexNumber?: string;
  course?: string;
  department?: string;
  title?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  registerLecturer: (data: any) => Promise<void>;
  registerStudent: (data: any) => Promise<void>;
  setUserSession: (user: UserProfile, token?: string) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setUserSession = (newUser: UserProfile, newToken?: string) => {
    setUser(newUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("evalia_user", JSON.stringify(newUser));
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("evalia_token", newToken);
      }
    }
  };

  // Initialize and verify user session on mount (or URL change)
  useEffect(() => {
    async function loadUserSession() {
      if (typeof window === "undefined") return;

      // Extract token from URL search query if redirected from Google OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      const activeToken = urlToken || localStorage.getItem("evalia_token");
      const storedUser = localStorage.getItem("evalia_user");

      if (urlToken) {
        localStorage.setItem("evalia_token", urlToken);
        setToken(urlToken);
      } else if (activeToken) {
        setToken(activeToken);
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user profile");
        }
      }

      if (activeToken) {
        // Verify token with backend
        try {
          const response = await api.get<any>("/auth/me", activeToken);
          const userObj = response.user || response.data?.user || response;
          if (userObj && (userObj.id || userObj.email)) {
            setUser(userObj);
            localStorage.setItem("evalia_user", JSON.stringify(userObj));
          }
        } catch (err: any) {
          console.warn("Session token verification warning:", err.message);
          if (!urlToken && !storedUser) {
            logout();
          }
        }
      }
      setIsLoading(false);
    }

    loadUserSession();
  }, [pathname]);

  const login = async (credentials: { email: string; password: string; role?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        setToken(newToken);
        setUser(newUser);

        localStorage.setItem("evalia_token", newToken);
        localStorage.setItem("evalia_user", JSON.stringify(newUser));

        // Auto-redirect based on role
        if (newUser.role === "student") {
          router.push("/user");
        } else {
          router.push("/admin");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerLecturer = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register/lecturer", data);
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("evalia_token", newToken);
        localStorage.setItem("evalia_user", JSON.stringify(newUser));
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register/student", data);
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("evalia_token", newToken);
        localStorage.setItem("evalia_user", JSON.stringify(newUser));
        router.push("/user");
      }
    } catch (err: any) {
      setError(err.message || "Student registration failed.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("evalia_token");
      localStorage.removeItem("evalia_user");
    }
    router.push("/");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        registerLecturer,
        registerStudent,
        setUserSession,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
