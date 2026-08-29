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
      lecturerId: req.user.userId,
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
    const { code } = req.params;
    const classData = await ClassModel.findByJoinCode(code);
    if (!classData) {
      return sendError(res, "Class cohort not found or invalid invite code.", null, 404);
    }
    return sendSuccess(res, "Fetched class details by join code.", { class: classData });
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
    const { joinCode, classId } = req.body;
    const result = await ClassModel.enrollStudent({
      classId,
      joinCode,
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
};
