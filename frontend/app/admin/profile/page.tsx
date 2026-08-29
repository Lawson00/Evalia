"use client";

import React, { useState } from "react";
import { User, Mail, Phone, Building2, BookOpen, ShieldCheck, Check, Save, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";

export default function AdminProfilePage() {
  const { user, setUserSession } = useAuth();

  const rawName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const displayName = rawName && rawName !== "Google User" ? rawName : user?.email?.split("@")[0] || "Lecturer";

  const [department, setDepartment] = useState(user?.department || "Computer Science");
  const [phone, setPhone] = useState(user?.phone || "+233 50 123 4567");
  const [title, setTitle] = useState(user?.title || "Lecturer");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        department,
        phone,
        title,
      };
      setUserSession(updatedUser);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName && rawName !== "Google User") {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return displayName ? displayName.slice(0, 2).toUpperCase() : "LC";
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }} className="animate-fade-in">
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <Badge variant="accent" size="sm">
              Academic Profile & Identity
            </Badge>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
            Lecturer Profile Settings
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Manage your account credentials, institutional department, and contact information.
          </p>
        </div>

        {saved && (
          <div
            style={{
              background: "var(--status-active-bg)",
              border: "1px solid var(--status-active)",
              borderRadius: 8,
              padding: "8px 14px",
              color: "var(--status-active)",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Check size={16} /> Profile Saved Successfully!
          </div>
        )}
      </div>

      {/* HEADER AVATAR CARD */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
            flexShrink: 0,
          }}
        >
          {getInitials()}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{displayName}</h2>
            <Badge variant="active" size="sm">
              <ShieldCheck size={12} /> Verified {user?.role === "admin" ? "Administrator" : "Lecturer"}
            </Badge>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            {user?.email}
          </p>
          <p style={{ fontSize: 12, color: "var(--accent-light)", marginTop: 4, fontWeight: 600 }}>
            {title} · {department}
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 10, margin: 0 }}>
            Personal & Academic Information
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-secondary)" }}>
                Full Display Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={displayName}
                  disabled
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 36px",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-secondary)" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-muted)" }} />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 36px",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Academic Department
              </label>
              <div style={{ position: "relative" }}>
                <BookOpen size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--accent)" }} />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="E.g. Computer Science"
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 36px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
                Phone Number
              </label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--accent)" }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 50 123 4567"
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "9px 12px 9px 36px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
              Academic Title
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            >
              <option value="Lecturer">Lecturer</option>
              <option value="Senior Lecturer">Senior Lecturer</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Professor">Professor</option>
              <option value="Department Chair">Department Chair</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
              }}
            >
              <Save size={15} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
