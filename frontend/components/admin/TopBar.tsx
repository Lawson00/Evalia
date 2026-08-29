"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  BookOpen,
  Layers,
  HelpCircle,
  FileText,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: "class" | "topic" | "question" | "assignment" | "student";
  url: string;
}

interface SearchResults {
  classes: SearchItem[];
  topics: SearchItem[];
  questions: SearchItem[];
  assignments: SearchItem[];
  students: SearchItem[];
}

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Search Overlay & Results State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    classes: [],
    topics: [],
    questions: [],
    assignments: [],
    students: [],
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const rawName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const displayName = rawName && rawName !== "Google User" ? rawName : user?.email?.split("@")[0] || "Lecturer";
  const userEmail = user?.email || "lecturer@univ.edu";

  const getInitials = () => {
    if (user?.firstName && user?.lastName && rawName !== "Google User") {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return displayName ? displayName.slice(0, 2).toUpperCase() : "LC";
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setResultsOpen(true);
      } else if (e.key === "Escape") {
        setResultsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setResultsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Backend Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ classes: [], topics: [], questions: [], assignments: [], students: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get<any>(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const searchRes = res.results || res.data?.results || { classes: [], topics: [], questions: [], assignments: [], students: [] };
        setResults(searchRes);
        setResultsOpen(true);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (url: string) => {
    setResultsOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  const totalResultsCount =
    results.classes.length +
    results.topics.length +
    results.questions.length +
    results.assignments.length +
    results.students.length;

  return (
    <header
      style={{
        height: 60,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Search Bar Container */}
      <div
        ref={searchContainerRef}
        style={{
          flex: 1,
          maxWidth: 420,
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 12,
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setResultsOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.trim()) setResultsOpen(true);
          }}
          placeholder="Search assignments, questions, classes, students…"
          style={{
            width: "100%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 32px 7px 34px",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />

        {searchQuery ? (
          <button
            onClick={() => {
              setSearchQuery("");
              setResultsOpen(false);
            }}
            style={{
              position: "absolute",
              right: 10,
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <kbd
            style={{
              position: "absolute",
              right: 10,
              fontSize: 10,
              color: "var(--text-muted)",
              background: "var(--bg-overlay)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "1px 5px",
              pointerEvents: "none",
            }}
          >
            ⌘K
          </kbd>
        )}

        {/* Global Live Search Results Dropdown Modal Overlay */}
        {resultsOpen && searchQuery.trim() !== "" && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
              maxHeight: 460,
              overflowY: "auto",
              zIndex: 100,
              padding: 12,
            }}
          >
            {isSearching ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                Searching database for "{searchQuery}"...
              </div>
            ) : totalResultsCount === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No matching assignments, questions, classes, or students found for "{searchQuery}".
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Classes Section */}
                {results.classes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <BookOpen size={12} /> Classes & Cohorts ({results.classes.length})
                    </div>
                    {results.classes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: "var(--bg-elevated)", marginBottom: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Topics Section */}
                {results.topics.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Layers size={12} /> Question Bank Topics ({results.topics.length})
                    </div>
                    {results.topics.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: "var(--bg-elevated)", marginBottom: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Questions Section */}
                {results.questions.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <HelpCircle size={12} /> Stored Questions ({results.questions.length})
                    </div>
                    {results.questions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: "var(--bg-elevated)", marginBottom: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assignments Section */}
                {results.assignments.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <FileText size={12} /> Assignments ({results.assignments.length})
                    </div>
                    {results.assignments.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: "var(--bg-elevated)", marginBottom: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Students Section */}
                {results.students.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={12} /> Students ({results.students.length})
                    </div>
                    {results.students.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.url)}
                        style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: "var(--bg-elevated)", marginBottom: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-muted)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Notification bell */}
      <button
        style={{
          position: "relative",
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          padding: 8,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "var(--bg-elevated)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "none";
          (e.currentTarget as HTMLElement).style.color =
            "var(--text-secondary)";
        }}
      >
        <Bell size={18} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            background: "var(--status-danger)",
            borderRadius: "50%",
            border: "2px solid var(--bg-surface)",
          }}
        />
      </button>

      {/* Profile dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--bg-elevated)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "none")
          }
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {getInitials()}
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {userEmail}
            </div>
          </div>
          <ChevronDown
            size={14}
            style={{
              color: "var(--text-muted)",
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              minWidth: 180,
              zIndex: 100,
              overflow: "hidden",
              animation: "fadeIn 0.15s ease",
            }}
          >
            <a
              href="/admin/profile"
              onClick={() => setDropdownOpen(false)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-elevated)";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <User size={14} /> Profile
            </a>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button
              onClick={logout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "none",
                border: "none",
                color: "var(--status-danger)",
                fontSize: 13,
                cursor: "pointer",
                transition: "background 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--status-danger-bg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "none")
              }
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
