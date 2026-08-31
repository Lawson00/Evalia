const AssignmentModel = require("../models/AssignmentModel");
const ClassModel = require("../models/ClassModel");
const AIService = require("../services/aiService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const getAssignments = async (req, res, next) => {
  try {
    const assignments = await AssignmentModel.getAllForUser(req.user);
    return sendSuccess(res, "Fetched assignments from database.", { assignments });
  } catch (err) {
    next(err);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      instructions,
      classId,
      totalPoints,
      passMark,
      passThreshold,
      durationMinutes,
      duration,
      proctoringEnabled,
      proctoringConfig,
      proctoring,
      accessMode,
      accessPassword,
      scheduledStart,
      scheduledEnd,
      dueDate,
      status,
      questionIds,
    } = req.body;

    if (!title) {
      return sendError(res, "Assignment title is required.", null, 400);
    }

    if (classId) {
      const canManageClass = await ClassModel.canManageClass(classId, req.user);
      if (!canManageClass) {
        return sendError(res, "Access forbidden for this class.", null, 403);
      }
    }

    const assignment = await AssignmentModel.createAssignment({
      lecturerId: req.user?.userId,
      user: req.user,
      title,
      description: description || instructions,
      classId,
      totalPoints: totalPoints || 100,
      passMark: passMark || passThreshold || 70,
      durationMinutes: durationMinutes || duration || 60,
      proctoringEnabled: proctoringEnabled !== false,
      proctoringConfig: proctoringConfig || proctoring,
      accessMode,
      accessPassword,
      scheduledStart,
      scheduledEnd: scheduledEnd || dueDate,
      dueDate: dueDate || scheduledEnd,
      status: status || "active",
      questionIds: questionIds || [],
    });

    return sendSuccess(res, "Assignment created successfully in database!", { assignment }, 201);
  } catch (err) {
    next(err);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await AssignmentModel.findByIdForUser(id, req.user);
    if (!assignment) {
      return sendError(res, "Assignment not found in database.", null, 404);
    }
    return sendSuccess(res, "Fetched assignment details from database.", { assignment });
  } catch (err) {
    next(err);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const canManage = await AssignmentModel.canManageAssignment(id, req.user);
    if (!canManage) {
      return sendError(res, "Access forbidden for this assignment.", null, 403);
    }

    if (req.body?.classId) {
      const canManageClass = await ClassModel.canManageClass(req.body.classId, req.user);
      if (!canManageClass) {
        return sendError(res, "Access forbidden for the target class.", null, 403);
      }
    }

    const assignment = await AssignmentModel.updateAssignment(id, req.body);
    if (!assignment) {
      return sendError(res, "Assignment not found.", null, 404);
    }
    return sendSuccess(res, "Assignment updated successfully.", { assignment });
  } catch (err) {
    next(err);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const canManage = await AssignmentModel.canManageAssignment(id, req.user);
    if (!canManage) {
      return sendError(res, "Access forbidden for this assignment.", null, 403);
    }

    await AssignmentModel.deleteAssignment(id);
    return sendSuccess(res, "Assignment deleted from database.");
  } catch (err) {
    next(err);
  }
};

const addRemoveQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const canManage = await AssignmentModel.canManageAssignment(id, req.user);
    if (!canManage) {
      return sendError(res, "Access forbidden for this assignment.", null, 403);
    }

    const { addQuestionIds, removeQuestionIds, questionIds } = req.body;
    const assignment = await AssignmentModel.addRemoveQuestions(id, {
      addQuestionIds,
      removeQuestionIds,
      questionIds,
    });
    if (!assignment) return sendError(res, "Assignment not found.", null, 404);
    return sendSuccess(res, "Updated assignment questions.", { assignment });
  } catch (err) {
    next(err);
  }
};

const getAssignmentAIInsights = async (req, res, next) => {
  try {
    const { id } = req.params;
    const canManage = await AssignmentModel.canManageAssignment(id, req.user);
    if (!canManage) {
      return sendError(res, "Access forbidden for this assignment.", null, 403);
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      return sendError(res, "Assignment not found.", null, 404);
    }

    const insights = await AIService.generateAssignmentInsights({
      assignmentTitle: assignment.title,
      questions: assignment.questions || [],
      candidates: assignment.candidates || [],
      attempts: assignment.attempts || [],
    });

    return sendSuccess(res, "Generated assignment AI performance insights.", { insights });
  } catch (err) {
    next(err);
  }
};

const startAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId;
    if (!studentId) {
      return sendError(res, "Authentication required to start attempt.", null, 401);
    }
    if (req.user?.role !== "student") {
      return sendError(res, "Only students can start assignment attempts.", null, 403);
    }
    const assignmentAccessToken = req.body?.assignmentAccessToken || req.headers["x-assignment-access-token"] || null;
    const attemptData = await AssignmentModel.startAttempt(id, studentId, req.user, assignmentAccessToken);
    return sendSuccess(res, "Started assignment attempt session.", attemptData);
  } catch (err) {
    next(err);
  }
};

const unlockAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId;
    if (!studentId) {
      return sendError(res, "Authentication required to unlock assignment.", null, 401);
    }
    if (req.user?.role !== "student") {
      return sendError(res, "Only students can unlock assignment attempts.", null, 403);
    }
    const unlock = await AssignmentModel.unlockAssignment(id, studentId, req.user, req.body?.password);
    return sendSuccess(res, "Assignment access verified.", unlock);
  } catch (err) {
    next(err);
  }
};

const logProctoringEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attemptId, eventType, severity, metadata } = req.body;
    const studentId = req.user?.userId;
    if (!studentId) {
      return sendError(res, "Authentication required to log proctoring events.", null, 401);
    }
    if (req.user?.role !== "student") {
      return sendError(res, "Only students can log assignment proctoring events.", null, 403);
    }

    await AssignmentModel.logProctoringEvent({
      attemptId,
      assignmentId: id,
      studentId,
      eventType,
      severity,
      metadata,
    });

    return sendSuccess(res, "Logged proctoring integrity event.");
  } catch (err) {
    next(err);
  }
};

const submitAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attemptId, answers, timeSpentSeconds, reason } = req.body;
    const studentId = req.user?.userId;
    if (!studentId) {
      return sendError(res, "Authentication required to submit attempt.", null, 401);
    }
    if (req.user?.role !== "student") {
      return sendError(res, "Only students can submit assignment attempts.", null, 403);
    }

    const result = await AssignmentModel.submitAttempt({
      attemptId,
      assignmentId: id,
      studentId,
      user: req.user,
      answers,
      timeSpentSeconds,
      reason,
    });

    return sendSuccess(res, "Assignment attempt submitted successfully.", { result });
  } catch (err) {
    next(err);
  }
};

const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const result = await AssignmentModel.getAttemptByIdForUser(attemptId, req.user);
    if (!result) {
      return sendError(res, "Attempt record not found.", null, 404);
    }
    return sendSuccess(res, "Fetched attempt result details.", { result });
  } catch (err) {
    next(err);
  }
};

const getStudentResults = async (req, res, next) => {
  try {
    const studentId = req.user?.userId;
    const data = await AssignmentModel.getStudentResultsList(studentId, req.user);
    return sendSuccess(res, "Fetched student assessment results.", data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAssignments,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addRemoveQuestions,
  getAssignmentAIInsights,
  unlockAssignment,
  startAttempt,
  logProctoringEvent,
  submitAttempt,
  getAttemptResult,
  getStudentResults,
};
