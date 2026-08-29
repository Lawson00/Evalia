"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Copy,
  Check,
  ChevronRight,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import api from "@/lib/api";

export interface ClassCohort {
  id: string;
  name: string;
  classCode: string;
  joinCode: string;
  department: string;
  subscribedStudentsCount: number;
  avgScorePercent?: number;
  assessmentWeighting?: number;
  passThreshold?: number;
  isEnrollmentOpen?: boolean;
  createdAt: string;
}

export default function ClassHubPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    classCode: "CS 101",
    department: "Computer Science",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassCohort | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    classCode: "",
    department: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassCohort | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/classes");
      const list = res.classes || res.data?.classes || res;
      setClasses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load classes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.classCode.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = classes.reduce((sum, c) => sum + (c.subscribedStudentsCount || 0), 0);
  const overallAvg = classes.length
    ? (classes.reduce((sum, c) => sum + (c.avgScorePercent || 78.4), 0) / classes.length).toFixed(1)
    : "78.4";

  const handleCopyLink = (classItem: ClassCohort, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/join/${classItem.joinCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(classItem.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateClass = async () => {
    if (!createForm.name.trim()) return;
    try {
      setIsCreating(true);
      const res = await api.post<any>("/classes", {
        name: createForm.name,
        classCode: createForm.classCode,
        department: createForm.department,
      });

      const created = res.class || res.data?.class || res;
      if (created && created.id) {
        setClasses([created, ...classes]);
      } else {
        await fetchClasses();
      }

      setCreateModalOpen(false);
      showNotification(`Class cohort "${createForm.name}" created successfully!`);
      setCreateForm({ name: "", classCode: "CS 101", department: "Computer Science" });
    } catch (err: any) {
      alert(err.message || "Failed to create class cohort.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (c: ClassCohort, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(c);
    setEditForm({
      name: c.name,
      classCode: c.classCode,
      department: c.department,
    });
    setEditModalOpen(true);
  };

  const handleEditClass = async () => {
    if (!editingClass || !editForm.name.trim()) return;
    try {
      setIsEditing(true);
      const res = await api.put<any>(`/classes/${editingClass.id}/settings`, {
        name: editForm.name,
        classCode: editForm.classCode,
        department: editForm.department,
      });

      const updated = res.class || res.data?.class || res;
      if (updated && updated.id) {
        setClasses(classes.map((c) => (c.id === editingClass.id ? { ...c, ...updated } : c)));
      } else {
        await fetchClasses();
      }

      setEditModalOpen(false);
      showNotification(`Class cohort "${editForm.name}" updated successfully!`);
      setEditingClass(null);
    } catch (err: any) {
      alert(err.message || "Failed to update class details.");
    } finally {
      setIsEditing(false);
    }
  };

  const openDeleteModal = (c: ClassCohort, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(c);
    setDeleteModalOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/classes/${classToDelete.id}`);
      setClasses(classes.filter((c) => c.id !== classToDelete.id));
      setDeleteModalOpen(false);
      showNotification(`Class cohort "${classToDelete.name}" deleted successfully.`);
      setClassToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete class cohort.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* SUCCESS NOTIFICATION TOAST */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: "var(--status-active-bg)",
            border: "1px solid var(--status-active)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "var(--status-active)",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <CheckCircle2 size={18} /> {notification}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Classes & Student Cohorts</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Organize student groups, share 1-click invitation links, edit class settings, and assess student performance.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          }}
        >
          <Plus size={16} /> Create Class Cohort
        </button>
      </div>

      {/* Summary Stat Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Active Classes", value: classes.length, color: "var(--text-primary)" },
          { label: "Subscribed Students", value: totalStudents, color: "var(--accent-light)" },
          { label: "Class Average Score", value: `${overallAvg}%`, color: "var(--status-active)" },
          { label: "Active Join Links", value: classes.length, color: "var(--status-info)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Control Bar & Search */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class cohort name, course code, or department…"
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px 8px 34px",
              color: "var(--text-primary)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
          Loading class cohorts...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 48, textAlign: "center" }}>
          <Users size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Class Cohorts Found</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            {search ? "No classes match your search query." : "Click 'Create Class Cohort' above to set up your first student group."}
          </p>
        </div>
      ) : (
        /* Class Cards Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
          {filteredClasses.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/admin/classes/${c.id}`)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <Badge variant="accent" size="sm">{c.classCode}</Badge>
                  
                  {/* Action Buttons: EDIT & DELETE */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={(e) => openEditModal(c, e)}
                      title="Edit Class Cohort"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: 6, color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(c, e)}
                      title="Delete Class Cohort"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: 6, color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {c.name}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>{c.department}</p>

                {/* Shareable Invite Link Box */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                      🔗 Shareable 1-Click Invite Link
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-light)", background: "var(--accent-muted)", padding: "2px 6px", borderRadius: 4 }}>
                      Code: {c.joinCode}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${c.joinCode}`}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: 11,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={(e) => handleCopyLink(c, e)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: copiedId === c.id ? "var(--status-active)" : "var(--accent)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {copiedId === c.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === c.id ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                {/* Stats Footer */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "var(--bg-elevated)", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>Subscribed Students</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{c.subscribedStudentsCount || 0} Students</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>Cohort Average</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "var(--status-active)" }}>{c.avgScorePercent || 78.4}%</span>
                  </div>
                </div>

                {/* Roster trigger button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 10,
                    borderTop: "1px solid var(--border-subtle)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--accent-light)",
                  }}
                >
                  <span>Manage Roster & Assess Students</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Class Cohort & Generate Invite Link"
        width={520}
        footer={
          <>
            <button
              onClick={() => setCreateModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateClass}
              disabled={isCreating}
              style={{ padding: "8px 18px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {isCreating ? "Creating..." : "Create Class & Link"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Class Name / Section Title
            </label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. CS 101 – Section B (Fall 2026)"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Associated Course Code
            </label>
            <input
              value={createForm.classCode}
              onChange={(e) => setCreateForm({ ...createForm, classCode: e.target.value })}
              placeholder="e.g. CS 101"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Department / Faculty
            </label>
            <input
              value={createForm.department}
              onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
              placeholder="e.g. Computer Science"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Class Cohort – ${editingClass?.name || ''}`}
        width={520}
        footer={
          <>
            <button
              onClick={() => setEditModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleEditClass}
              disabled={isEditing}
              style={{ padding: "8px 18px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              {isEditing ? "Saving..." : "Save Changes"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Class Name / Section Title
            </label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="e.g. CS 101 – Section B"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Course Code
            </label>
            <input
              value={editForm.classCode}
              onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value })}
              placeholder="e.g. CS 101"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Department
            </label>
            <input
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              placeholder="e.g. Computer Science"
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Class Cohort Deletion"
        width={460}
        footer={
          <>
            <button
              onClick={() => setDeleteModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClass}
              disabled={isDeleting}
              style={{ padding: "8px 18px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isDeleting ? "Deleting..." : "Delete Class"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <AlertTriangle size={24} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 6 }}>
              Are you sure you want to delete <strong>{classToDelete?.name}</strong>?
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              This action cannot be undone. All student cohort subscriptions and link associations for this class will be permanently removed.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
