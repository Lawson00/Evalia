"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Check,
  KeyRound,
  ShieldCheck,
  UserRound,
  Loader2,
  Mail,
  Phone,
  GraduationCap,
  Lock,
} from "lucide-react";

export function SettingsPage() {
  const { user, login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("evalia_token") ||
            localStorage.getItem("token")
          : null;
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/v1/auth/me", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (isMounted && data.success && data.data?.user) {
          const u = data.data.user;
          setFirstName(u.firstName || u.first_name || "");
          setLastName(u.lastName || u.last_name || "");
          setEmail(u.email || "");
          setIndexNumber(u.indexNumber || u.index_number || "");
          setPhone(u.phone || "");
        } else if (isMounted && user) {
          setFirstName(user.firstName || user.fullName?.split(" ")[0] || "");
          setLastName(user.lastName || user.fullName?.split(" ")[1] || "");
          setEmail(user.email || "");
          setIndexNumber(user.indexNumber || "");
          setPhone(user.phone || "");
        }
      } catch (err) {
        console.warn(
          "Could not fetch profile from server, using auth context:",
          err,
        );
        if (isMounted && user) {
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
          setEmail(user.email || "");
          setIndexNumber(user.indexNumber || "");
          setPhone(user.phone || "");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match. Please re-enter.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("evalia_token") || localStorage.getItem("token")
        : null;
    try {
      setSaving(true);
      const res = await fetch("http://localhost:5000/api/v1/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          indexNumber,
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrorMsg(data.message || "Failed to update profile details.");
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || "Server connection error while saving profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const f = firstName ? firstName[0] : "S";
    const l = lastName ? lastName[0] : "";
    return `${f}${l}`.toUpperCase();
  };

  if (loading) {
    return (
      <main className="detail-page settings-page">
        <div
          style={{
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e6e9ef",
            marginTop: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
          }}
        >
          <Loader2
            size={36}
            className="animate-spin"
            style={{ color: "#6255e7", marginBottom: 16 }}
          />
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1d2536",
              margin: "0 0 4px",
            }}
          >
            Loading profile details…
          </p>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            Fetching user info from backend server
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="detail-page settings-page">
      {/* Page Header */}
      <div className="page-intro">
        <p className="eyebrow">Student Account</p>
        <h1>My Profile</h1>
        <p>
          View and update your personal information, index number, and portal
          credentials.
        </p>
      </div>

      <div
        className="settings-layout"
        style={{ display: "block", maxWidth: 840 }}
      >
        <form onSubmit={handleSaveProfile} className="settings-stack">
          {/* Profile Identity Card */}
          <section id="profile" className="settings-card">
            <div className="card-title">
              <div className="setting-icon">
                <UserRound size={18} />
              </div>
              <div>
                <h2>Personal Details</h2>
                <p>
                  Your identity as visible to lecturers and course
                  administrators.
                </p>
              </div>
            </div>

            <div
              className="profile-editor"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                margin: "20px 0",
              }}
            >
              <span
                className="avatar profile-avatar"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#6255e7",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                {getInitials()}
              </span>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1d2536",
                    margin: 0,
                  }}
                >
                  {firstName} {lastName}
                </h3>
                <p
                  style={{ fontSize: 13, color: "#64748b", margin: "2px 0 0" }}
                >
                  Student Portal Member
                </p>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-grid">
              <label>
                First Name
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </label>

              <label>
                Index / Student ID Number
                <input
                  type="text"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                  placeholder="e.g. IND-2026-892"
                />
              </label>

              <label>
                Phone Number
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0205150909"
                />
              </label>

              <label className="full-width">
                Email address (Primary Account ID)
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{
                    background: "#f8fafc",
                    color: "#64748b",
                    cursor: "not-allowed",
                  }}
                />
              </label>
            </div>
          </section>

          {/* Security & Password Update Card */}
          <section
            id="security"
            className="settings-card"
            style={{ marginTop: 24 }}
          >
            <div className="card-title">
              <div className="setting-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2>Account Security</h2>
                <p>
                  Update your password to keep your student account protected.
                </p>
              </div>
            </div>

            <div className="form-grid" style={{ marginTop: 16 }}>
              <label>
                New Password
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </label>

              <label>
                Confirm New Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </label>
            </div>

            <div
              className="settings-footer"
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  color: "#16a34a",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {saved && (
                  <>
                    <Check size={16} /> Profile &amp; security details saved
                    successfully!
                  </>
                )}
              </span>

              <button
                type="submit"
                disabled={saving}
                className="primary-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
