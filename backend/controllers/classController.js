const ClassModel = require("../models/ClassModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const getClasses = async (req, res, next) => {
  try {
    const classes = await ClassModel.getAllForUser(req.user);
    return sendSuccess(res, "Fetched classes successfully.", { classes });
  } catch (err) {
    next(err);
  }
};

const createClass = async (req, res, next) => {
  try {
    const { name, classCode, department } = req.body;
    if (!name) {
      return sendError(res, "Class name is required.", null, 400);
    }
    const newClass = await ClassModel.createClass({
      lecturerId: req.user?.userId,
      user: req.user,
      name,
      classCode,
      department,
    });
    return sendSuccess(res, "Class cohort created successfully!", { class: newClass }, 201);
  } catch (err) {
    next(err);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const classData = await ClassModel.findByIdForUser(classId, req.user);
    if (!classData) {
      return sendError(res, "Class not found.", null, 404);
    }
    return sendSuccess(res, "Fetched class details.", { class: classData });
  } catch (err) {
    next(err);
  }
};

const getClassByCode = async (req, res, next) => {
  try {
    return sendError(res, "Manual class code lookup has been disabled. Use the lecturer invitation link.", null, 410);
  } catch (err) {
    next(err);
  }
};

const toInviteUrl = (req, token) => {
  const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`.replace(":5000", ":3000");
  return `${clientUrl}/join/${token}`;
};

const getInvitationLink = async (req, res, next) => {
  try {
    const invite = await ClassModel.getInvitationForUser(req.params.classId, req.user);
    if (!invite) return sendError(res, "Access forbidden for this class.", null, 403);
    return sendSuccess(res, "Fetched class invitation link status.", { invitation: invite });
  } catch (err) {
    next(err);
  }
};

const rotateInvitationLink = async (req, res, next) => {
  try {
    const inviteClass = await ClassModel.rotateInvitationForUser(req.params.classId, req.user, {
      expiresAt: req.body?.expiresAt,
    });
    if (!inviteClass) return sendError(res, "Access forbidden for this class.", null, 403);
    const invite = {
      classId: inviteClass.id,
      status: inviteClass.invitationStatus,
      expiresAt: inviteClass.invitationExpiresAt,
      joinedCount: inviteClass.invitationJoinCount,
      hasLink: true,
      url: toInviteUrl(req, inviteClass.invitationToken),
    };
    return sendSuccess(res, "Class invitation link rotated successfully.", { invitation: invite });
  } catch (err) {
    next(err);
  }
};

const updateInvitationLink = async (req, res, next) => {
  try {
    const inviteClass = await ClassModel.updateInvitationForUser(req.params.classId, req.user, {
      status: req.body?.status,
      expiresAt: req.body?.expiresAt,
    });
    if (!inviteClass) return sendError(res, "Access forbidden for this class.", null, 403);
    return sendSuccess(res, "Class invitation link updated successfully.", {
      invitation: {
        classId: inviteClass.id,
        status: inviteClass.invitationStatus,
        expiresAt: inviteClass.invitationExpiresAt,
        joinedCount: inviteClass.invitationJoinCount,
        hasLink: inviteClass.hasInvitationLink,
      },
    });
  } catch (err) {
    next(err);
  }
};

const revokeInvitationLink = async (req, res, next) => {
  try {
    const inviteClass = await ClassModel.revokeInvitationForUser(req.params.classId, req.user);
    if (!inviteClass) return sendError(res, "Access forbidden for this class.", null, 403);
    return sendSuccess(res, "Class invitation link revoked successfully.", {
      invitation: {
        classId: inviteClass.id,
        status: inviteClass.invitationStatus,
        expiresAt: inviteClass.invitationExpiresAt,
        joinedCount: inviteClass.invitationJoinCount,
        hasLink: false,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateClassSettings = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name, classCode, department, assessmentWeighting, passThreshold, gradeScale, isEnrollmentOpen } = req.body;

    const updated = await ClassModel.updateSettingsForUser(classId, req.user, {
      name,
      classCode,
      department,
      assessmentWeighting,
      passThreshold,
      gradeScale,
      isEnrollmentOpen,
    });

    if (!updated) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }

    return sendSuccess(res, "Class details & settings updated successfully!", { class: updated });
  } catch (err) {
    next(err);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const deleted = await ClassModel.deleteClassForUser(classId, req.user);
    if (!deleted) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }
    return sendSuccess(res, "Class cohort deleted successfully.");
  } catch (err) {
    next(err);
  }
};

const enrollStudent = async (req, res, next) => {
  try {
    const invitationToken = req.body?.invitationToken || req.params.token;
    const result = await ClassModel.enrollStudentWithInvitation({
      token: invitationToken,
      studentId: req.user?.userId,
      studentEmail: req.user?.email,
      studentName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : null,
    });

    if (!result.success) {
      return sendError(res, result.message || "Failed to enroll into class.", null, 400);
    }

    return sendSuccess(res, result.alreadyEnrolled ? "You are already enrolled in this class!" : "Enrolled into class cohort successfully!", {
      class: result.class,
      alreadyEnrolled: result.alreadyEnrolled,
    });
  } catch (err) {
    next(err);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    const removed = await ClassModel.removeStudentForUser(classId, studentId, req.user);
    if (!removed) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }
    return sendSuccess(res, "Student removed from class roster successfully.");
  } catch (err) {
    next(err);
  }
};

const getStudentReport = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    if (req.user?.role === "student" && req.user.userId !== studentId) {
      return sendError(res, "Access forbidden for this student report.", null, 403);
    }

    const report = await ClassModel.getStudentReportForUser(classId, studentId, req.user);
    if (!report) {
      return sendError(res, "Student assessment report not found.", null, 404);
    }
    return sendSuccess(res, "Fetched student assessment report.", { report });
  } catch (err) {
    next(err);
  }
};

const addStudentNote = async (req, res, next) => {
  try {
    const { classId, studentId } = req.params;
    const { note } = req.body;
    if (!note) {
      return sendError(res, "Note content is required.", null, 400);
    }
    const saved = await ClassModel.addStudentNoteForUser(classId, studentId, note, req.user);
    if (!saved) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }
    return sendSuccess(res, "Lecturer note saved successfully.");
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      return sendError(res, "Title and content are required for announcement.", null, 400);
    }
    const announcement = await ClassModel.createAnnouncement(classId, req.user, { title, content });
    if (!announcement) {
      return sendError(res, "Failed to create announcement.", null, 400);
    }
    return sendSuccess(res, "Announcement posted successfully!", { announcement }, 201);
  } catch (err) {
    next(err);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const announcements = await ClassModel.getAnnouncements(classId);
    return sendSuccess(res, "Fetched class announcements.", { announcements });
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { classId, announcementId } = req.params;
    const deleted = await ClassModel.deleteAnnouncement(classId, announcementId, req.user);
    if (!deleted) {
      return sendError(res, "Failed to delete announcement.", null, 400);
    }
    return sendSuccess(res, "Announcement deleted successfully.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClasses,
  createClass,
  getClassById,
  getClassByCode,
  updateClassSettings,
  deleteClass,
  enrollStudent,
  removeStudent,
  getStudentReport,
  addStudentNote,
  createAnnouncement,
  getAnnouncements,
	  deleteAnnouncement,
	  getInvitationLink,
	  rotateInvitationLink,
	  updateInvitationLink,
	  revokeInvitationLink,
	};
