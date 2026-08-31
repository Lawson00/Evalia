"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  Copy,
  Check,
  Award,
  ShieldAlert,
  BarChart3,
  Eye,
  Settings,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column } from "@/components/ui/DataTable";
import api, { apiRequest } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";

export interface StudentClassRecord {
  studentId: string;
  studentName: string;
  studentEmail: string;
  indexNumber: string;
  classId?: string;
  joinedDate: string;
  earnedPoints: number;
  totalClassPoints: number;
  completedAssignments?: number;
  proctoringFlagsCount: number;
}

export interface ClassDetailData {
  id: string;
  name: string;
  classCode: string;
  joinCode?: string;
  department: string;
  assessmentWeighting: number;
  passThreshold: number;
  gradeScale: { aPlus: number; a: number; b: number; c: number; d: number };
  isEnrollmentOpen: boolean;
  subscribedStudentsCount: number;
  invitationStatus?: "active" | "paused" | "revoked";
  invitationExpiresAt?: string | null;
  invitationJoinCount?: number;
  hasInvitationLink?: boolean;
  students: StudentClassRecord[];
}

interface InvitationState {
  status: "active" | "paused" | "revoked";
  expiresAt: string | null;
  joinedCount: number;
  hasLink: boolean;
  url?: string;
}

interface InvitationResponse {
  invitation?: InvitationState;
}

export default function ClassDetailPage() {
  const { classId } = useParams();
  const router = useRouter();

  const [classData, setClassData] = useState<ClassDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // CLASS SETTINGS STATE
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDept, setFormDept] = useState("");
  const [classWeighting, setClassWeighting] = useState<number>(30);
  const [passThreshold, setPassThreshold] = useState<number>(60);
  const [allowEnrollment, setAllowEnrollment] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [gradeBoundaries, setGradeBoundaries] = useState({
    aPlus: 90,
    a: 80,
    b: 70,
    c: 60,
    d: 50,
  });

  // Student Removal State
  const [studentToRemove, setStudentToRemove] = useState<StudentClassRecord | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);

  // ANNOUNCEMENTS STATE
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get<any>(`/classes/${classId}/announcements`);
      const items = res.announcements || res.data?.announcements || [];
      setAnnouncementsList(items);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  };

  const syncInvitationState = (invite: InvitationState) => {
    setClassData((current) =>
      current
        ? {
            ...current,
            invitationStatus: invite.status,
            invitationExpiresAt: invite.expiresAt,
            invitationJoinCount: invite.joinedCount,
            hasInvitationLink: invite.hasLink,
          }
        : current
    );
    if (invite.url) setInviteUrl(invite.url);
    if (!invite.hasLink) setInviteUrl(null);
  };

  const fetchInvitation = async () => {
    try {
      const res = await api.get<InvitationResponse>(`/classes/${classId}/invitation`);
      if (res.invitation) syncInvitationState(res.invitation);
    } catch (err) {
      console.error("Failed to load invitation status:", err);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    try {
      setIsPostingAnnouncement(true);
      await api.post<any>(`/classes/${classId}/announcements`, {
        title: announcementTitle,
        content: announcementContent,
      });
      showNotification("Announcement posted to class cohort stream!");
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      console.error("Error posting announcement:", err);
      showNotification(err.message || "Failed to post announcement.");
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      await api.delete<any>(`/classes/${classId}/announcements/${announcementId}`);
      showNotification("Announcement removed.");
      fetchAnnouncements();
    } catch (err: any) {
      console.error("Error deleting announcement:", err);
    }
  };

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(`/classes/${classId}`);
      const target = res.class || res.data?.class || res;

      if (target && target.id) {
        setClassData(target);
        setFormName(target.name);
        setFormCode(target.classCode);
        setFormDept(target.department);
        setClassWeighting(target.assessmentWeighting || 30);
        setPassThreshold(target.passThreshold || 60);
        setAllowEnrollment(target.isEnrollmentOpen !== false);
        if (target.gradeScale) setGradeBoundaries(target.gradeScale);
      }
    } catch (err) {
      console.error("Failed to load class details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchAnnouncements();
      fetchInvitation();
    }
  }, [classId]);

  const handleRotateAndCopyLink = async () => {
    if (!classData) return;
    const cleanCode = classData.joinCode || classData.classCode || classData.id;
    let linkToCopy = `${window.location.origin}/join/${encodeURIComponent(cleanCode)}`;

    try {
      setInviteLoading(true);
      const response = await api.post<any>(`/classes/${classData.id}/invitation/rotate`, {});
      const invite = response?.invitation || response?.data?.invitation || response;
      if (invite?.url) {
        linkToCopy = invite.url;
      } else if (invite?.invitationToken) {
        linkToCopy = `${window.location.origin}/join/${invite.invitationToken}`;
      }
      if (invite) {
        syncInvitationState(invite);
      }
    } catch (err) {
      console.warn("Server rotation notice, falling back to direct class join link:", err);
    } finally {
      setInviteLoading(false);
    }

    const copied = await copyToClipboard(linkToCopy);
    if (copied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showNotification("Class invite link copied to clipboard!");
    } else {
      showNotification("Failed to copy link automatically. Please try again.");
    }
  };

  const handlePauseResumeInvitation = async () => {
    if (!classData) return;
    const nextStatus = classData.invitationStatus === "paused" ? "active" : "paused";
    try {
      setInviteLoading(true);
      const response = await apiRequest<InvitationResponse>(`/classes/${classData.id}/invitation`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.invitation) syncInvitationState(response.invitation);
      showNotification(nextStatus === "paused" ? "Invitation link paused." : "Invitation link resumed.");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to update invitation link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvitation = async () => {
    if (!classData) return;
    try {
      setInviteLoading(true);
      const response = await api.delete<InvitationResponse>(`/classes/${classData.id}/invitation`);
      if (response.invitation) syncInvitationState(response.invitation);
      showNotification("Invitation link revoked.");
    } catch (err) {
      showNotification(err instanceof Error ? err.message : "Failed to revoke invitation link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!classData) return;
    try {
      setIsSavingSettings(true);
      const res = await api.put<any>(`/classes/${classData.id}/settings`, {
        name: formName,
        classCode: formCode,
        department: formDept,
        assessmentWeighting: classWeighting,
        passThreshold,
        gradeScale: gradeBoundaries,
        isEnrollmentOpen: allowEnrollment,
      });

      const updated = res.class || res.data?.class || res;
      if (updated) {
        setClassData({
          ...classData,
          ...updated,
          students: classData.students || [],
        });
        showNotification("Class settings updated successfully!");
      }
      setSettingsOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save class settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!classData || !studentToRemove) return;
    try {
      setIsRemovingStudent(true);
      await api.delete(`/classes/${classData.id}/students/${studentToRemove.studentId}`);
      setClassData({
        ...classData,
        subscribedStudentsCount: Math.max(0, classData.subscribedStudentsCount - 1),
        students: (classData.students || []).filter((s) => s.studentId !== studentToRemove.studentId),
      });
      showNotification(`Student ${studentToRemove.studentName} removed from roster.`);
      setStudentToRemove(null);
    } catch (err: any) {
      alert(err.message || "Failed to remove student from roster.");
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const getWeightedScore = (earned: number, total: number, weight: number) => {
    if (!total || total === 0) return 0;
    return ((earned / total) * weight).toFixed(1);
  };

  const getRawPercent = (earned: number, total: number) => {
    if (!total || total === 0) return 0;
    return ((earned / total) * 100).toFixed(1);
  };

  const getLetterGrade = (rawPct: number) => {
    if (rawPct >= gradeBoundaries.aPlus) return "A+";
    if (rawPct >= gradeBoundaries.a) return "A";
    if (rawPct >= gradeBoundaries.b) return "B";
    if (rawPct >= gradeBoundaries.c) return "C";
    if (rawPct >= gradeBoundaries.d) return "D";
    return "F";
  };

  const studentsList = classData?.students || [];

  const filteredStudents = studentsList.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.indexNumber.toLowerCase().includes(search.toLowerCase());
    
    const hasAttempts = s.completedAssignments && s.completedAssignments > 0;
    const totalPts = s.totalClassPoints || 100;
    const rawPct = hasAttempts ? (s.earnedPoints / totalPts) * 100 : -1;

    let tier = "not_graded";
    if (hasAttempts) {
      tier = rawPct >= gradeBoundaries.a ? "top" : rawPct >= passThreshold ? "passing" : "at_risk";
    }

    const matchTier = tierFilter === "all" || tier === tierFilter;
    return matchSearch && matchTier;
  });

  const columns: Column<StudentClassRecord>[] = [
    {
      key: "studentName",
      header: "Subscribed Student",
      sortable: true,
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {row.studentName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.studentName}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{row.studentEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: "indexNumber",
      header: "Index Number",
      sortable: true,
      render: (row) => (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent-light)",
            background: "var(--accent-muted)",
            padding: "3px 8px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          {row.indexNumber}
        </span>
      ),
    },
    { key: "joinedDate", header: "Joined Date", render: (row) => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{row.joinedDate}</span> },
    {
      key: "earnedPoints",
      header: "Total Score Sum",
      sortable: true,
      render: (row) => {
        const hasAttempts = row.completedAssignments && row.completedAssignments > 0;
        if (!hasAttempts) {
          return <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>No submissions yet</span>;
        }
        const totalPts = row.totalClassPoints || 100;
        return (
          <div>
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              {row.earnedPoints} / {totalPts} pts
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>
              ({getRawPercent(row.earnedPoints, totalPts)}% Accuracy)
            </span>
          </div>
        );
      },
    },
    {
      key: "weightedScore",
      header: `Weighted Score (${classWeighting}%)`,
      sortable: true,
      render: (row) => {
        const hasAttempts = row.completedAssignments && row.completedAssignments > 0;
        if (!hasAttempts) {
          return <span style={{ fontSize: 13, color: "var(--text-muted)" }}>--</span>;
        }
        const totalPts = row.totalClassPoints || 100;
        const weighted = getWeightedScore(row.earnedPoints, totalPts, classWeighting);
        const rawPct = (row.earnedPoints / totalPts) * 100;
        return (
          <div>
            <span
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: rawPct >= passThreshold ? "var(--status-active)" : "var(--status-danger)",
              }}
            >
              {weighted}%
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
              out of {classWeighting}%
            </span>
          </div>
        );
      },
    },
    {
      key: "performanceTier",
      header: "Letter Grade",
      render: (row) => {
        const hasAttempts = row.completedAssignments && row.completedAssignments > 0;
        if (!hasAttempts) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-muted)" }}>--</span>
              <Badge variant="published" size="sm">
                Pending
              </Badge>
            </div>
          );
        }
        const totalPts = row.totalClassPoints || 100;
        const rawPct = (row.earnedPoints / totalPts) * 100;
        const grade = getLetterGrade(rawPct);
        const isPass = rawPct >= passThreshold;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent-light)" }}>{grade}</span>
            <Badge variant={isPass ? "active" : "danger"} size="sm">
              {isPass ? "Pass" : "Fail"}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "proctoringFlagsCount",
      header: "Proctor Flags",
      render: (row) =>
        row.proctoringFlagsCount > 0 ? (
          <Badge variant="danger" size="sm">
            {row.proctoringFlagsCount} Flags
          </Badge>
        ) : (
          <span style={{ fontSize: 12, color: "var(--status-active)" }}>✓ Clean</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={`/admin/classes/${classId}/student/${row.studentId}?weight=${classWeighting}&pass=${passThreshold}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              borderRadius: 7,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            }}
          >
            <Eye size={13} /> Assess Student
          </Link>

          <button
            onClick={() => setStudentToRemove(row)}
            title="Remove student from roster"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: 7, padding: 6, color: "#ef4444", cursor: "pointer" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        Loading class cohort details...
      </div>
    );
  }

  if (!classData) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
        <h2>Class Cohort Not Found</h2>
        <Link href="/admin/classes" style={{ color: "var(--accent-light)", marginTop: 12, display: "inline-block" }}>
          ← Back to Classes
        </Link>
      </div>
    );
  }

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

      {/* Back button + Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/admin/classes"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-muted)",
            fontSize: 13,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={14} /> Back to Classes & Cohorts
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
	            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
	              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{classData.name}</h1>
	              <Badge variant="accent">{classData.classCode}</Badge>
	              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-light)", background: "var(--accent-muted)", padding: "3px 8px", borderRadius: 6 }}>
	                Invite: {(classData.invitationStatus || "revoked").toUpperCase()}
	              </span>
	            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {classData.department} · {studentsList.length} Subscribed Students Enrolled
            </p>
          </div>

	          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setAnnouncementModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(16, 185, 129, 0.25)",
              }}
            >
              <Sparkles size={15} /> Post Announcement
            </button>

	            <button
	              onClick={() => setSettingsOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
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
              <Settings size={16} /> Edit Class Settings
            </button>
          </div>
	        </div>
	      </div>

	      <div
	        style={{
	          background: "var(--bg-surface)",
	          border: "1px solid var(--border)",
	          borderRadius: 14,
	          padding: 18,
	          marginBottom: 24,
	          display: "grid",
	          gridTemplateColumns: "minmax(240px, 1fr) auto",
	          gap: 16,
	          alignItems: "center",
	        }}
	      >
	        <div>
	          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
	            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>Class Invitation Link</span>
	            <Badge variant={classData.invitationStatus === "active" ? "active" : "muted"} size="sm">
	              {(classData.invitationStatus || "revoked").toUpperCase()}
	            </Badge>
	            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
	              {classData.invitationJoinCount || 0} joined via link
	            </span>
	            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
	              {classData.invitationExpiresAt ? `Expires ${new Date(classData.invitationExpiresAt).toLocaleString()}` : "No expiry set"}
	            </span>
	          </div>
	          <input
	            readOnly
	            value={inviteUrl || (classData.hasInvitationLink ? "Secure link stored. Rotate to reveal a fresh URL." : "No active invitation link")}
	            style={{
	              width: "100%",
	              background: "var(--bg-elevated)",
	              border: "1px solid var(--border)",
	              borderRadius: 8,
	              padding: "9px 12px",
	              color: "var(--text-secondary)",
	              fontSize: 12,
	              outline: "none",
	            }}
	          />
	        </div>

	        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
	          <button
	            type="button"
	            onClick={handleRotateAndCopyLink}
	            disabled={inviteLoading}
	            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: copied ? "var(--status-active)" : "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
	          >
	            {copied ? <Check size={14} /> : <Copy size={14} />}
	            {copied ? "Copied" : "Rotate & Copy"}
	          </button>
	          <button
	            type="button"
	            onClick={handlePauseResumeInvitation}
	            disabled={inviteLoading || classData.invitationStatus === "revoked"}
	            style={{ padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", cursor: "pointer", opacity: inviteLoading || classData.invitationStatus === "revoked" ? 0.6 : 1 }}
	          >
	            {classData.invitationStatus === "paused" ? "Resume" : "Pause"}
	          </button>
	          <button
	            type="button"
	            onClick={handleRevokeInvitation}
	            disabled={inviteLoading || classData.invitationStatus === "revoked"}
	            style={{ padding: "9px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer", opacity: inviteLoading || classData.invitationStatus === "revoked" ? 0.6 : 1 }}
	          >
	            Revoke
	          </button>
	        </div>
	      </div>
	
	      {/* Stat Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Subscribed Students", value: studentsList.length, color: "var(--text-primary)" },
          { label: "Assessment Weighting", value: `${classWeighting}%`, color: "var(--accent-light)" },
          { label: "Class Pass Limit", value: `${passThreshold}%`, color: "var(--status-info)" },
          { label: "Enrollment Status", value: allowEnrollment ? "Open" : "Closed", color: allowEnrollment ? "var(--status-active)" : "var(--status-danger)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Roster & Assessment Table Section */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", flexWrap: "wrap" }}>
          {/* Search Input */}
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscribed students by name, email, or index number…"
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "7px 10px 7px 30px",
                color: "var(--text-primary)",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {/* Performance Filter Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: 8, padding: 3 }}>
            {[
              { id: "all", label: `All (${studentsList.length})` },
              { id: "top", label: "⭐ Top Performers" },
              { id: "passing", label: "✓ Passing" },
              { id: "at_risk", label: "⚠️ At Risk" },
              { id: "not_graded", label: "⏳ Pending Submissions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTierFilter(tab.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: tierFilter === tab.id ? "var(--bg-overlay)" : "transparent",
                  color: tierFilter === tab.id ? "var(--accent-light)" : "var(--text-muted)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable columns={columns} data={filteredStudents} keyField="studentId" emptyMessage="No student records found in roster." />
      </div>

      {/* LECTURER ANNOUNCEMENTS & COURSE NOTES STREAM MANAGEMENT */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 14, marginTop: 24, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📢</span> Lecturer Announcements & Course Notes Stream
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Official notifications published to enrolled students in {classData.name}
            </p>
          </div>
          <button
            onClick={() => setAnnouncementModalOpen(true)}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #10B981, #059669)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={15} /> Add Announcement
          </button>
        </div>

        {announcementsList && announcementsList.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {announcementsList.map((ann: any) => (
              <div
                key={ann.id}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-light)" }}>
                      📢 {ann.title}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {ann.createdAt} · By {ann.lecturerName}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {ann.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  title="Delete Announcement"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              background: "var(--bg-elevated)",
              border: "1px dashed var(--border)",
              borderRadius: 10,
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No announcements posted for this class yet. Click <strong>"Add Announcement"</strong> above to broadcast instructions to enrolled students.
          </div>
        )}
      </div>

      {/* COMPREHENSIVE CLASS SETTINGS & EDIT MODAL */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={`Edit Class Details & Weighting – ${classData.name}`}
        width={640}
        footer={
          <>
            <button
              onClick={() => setSettingsOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              style={{ padding: "8px 20px", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isSavingSettings ? "Saving..." : "Save Class Details & Settings"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section 0: Class Identification */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              Class Name & Information
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Class Name"
                style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Course Code (e.g. CS 101)"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                />
                <input
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder="Department"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Section 1: Continuous Assessment Weighting % */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              1. Class Total Assessment Weighting %
            </label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
              Set how much continuous assessment contributes to final class grade.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[30, 40, 50, 60, 100].map((wVal) => (
                <button
                  key={wVal}
                  onClick={() => setClassWeighting(wVal)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    background: classWeighting === wVal ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "var(--bg-elevated)",
                    color: classWeighting === wVal ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${classWeighting === wVal ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer",
                  }}
                >
                  {wVal}%
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Custom Grade Boundaries */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              2. Custom Grade Boundaries (Letter Grade Scale)
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Grade A+", key: "aPlus" },
                { label: "Grade A", key: "a" },
                { label: "Grade B", key: "b" },
                { label: "Grade C", key: "c" },
                { label: "Grade D", key: "d" },
              ].map((g) => (
                <div key={g.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                    {g.label} (≥ %)
                  </label>
                  <input
                    type="number"
                    value={(gradeBoundaries as any)[g.key]}
                    onChange={(e) =>
                      setGradeBoundaries({
                        ...gradeBoundaries,
                        [g.key]: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 7,
                      padding: "6px 8px",
                      color: "var(--text-primary)",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pass Threshold & Enrollment */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  3. Class Pass Threshold %
                </label>
                <input
                  type="number"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  4. Student Enrollment Status
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginTop: 10 }}>
                  <input
                    type="checkbox"
                    checked={allowEnrollment}
                    onChange={(e) => setAllowEnrollment(e.target.checked)}
                    style={{ accentColor: "var(--accent)", width: 16, height: 16 }}
                  />
                  <span>Enrollment Open</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* STUDENT REMOVAL MODAL */}
      <Modal
        open={Boolean(studentToRemove)}
        onClose={() => setStudentToRemove(null)}
        title="Confirm Student Removal from Roster"
        width={460}
        footer={
          <>
            <button
              onClick={() => setStudentToRemove(null)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveStudent}
              disabled={isRemovingStudent}
              style={{ padding: "8px 18px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isRemovingStudent ? "Removing..." : "Remove Student"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <AlertTriangle size={24} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 6 }}>
              Remove <strong>{studentToRemove?.studentName}</strong> from roster?
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              This will un-enroll {studentToRemove?.studentEmail} ({studentToRemove?.indexNumber}) from {classData.name}. They will lose access to class assessments.
            </p>
          </div>
        </div>
      </Modal>

      {/* POST ANNOUNCEMENT MODAL */}
      <Modal
        open={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="📢 Post Class Announcement / Course Note"
        width={540}
        footer={
          <>
            <button
              onClick={() => setAnnouncementModalOpen(false)}
              style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handlePostAnnouncement}
              disabled={isPostingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
              style={{ padding: "8px 18px", background: "linear-gradient(135deg, #10B981, #059669)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {isPostingAnnouncement ? "Posting..." : "Publish to Class Stream"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Announcement Title
            </label>
            <input
              type="text"
              placeholder="e.g. Midterm Assessment Opening Announcement"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Announcement Body / Course Note
            </label>
            <textarea
              rows={5}
              placeholder="Type your official announcement or course instructions for enrolled students..."
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", color: "var(--text-primary)", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
