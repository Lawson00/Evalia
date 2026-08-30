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

module.exports = {
  getAssignments,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addRemoveQuestions,
  getAssignmentAIInsights,
};
