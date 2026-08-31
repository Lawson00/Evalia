const AnalyticsModel = require("../models/AnalyticsModel");
const { sendSuccess } = require("../utils/responseHandler");

const getOverview = async (req, res, next) => {
  try {
    const lecturerId = req.query.lecturerId || req.user.userId;
    const stats = await AnalyticsModel.getOverview(lecturerId);
    return sendSuccess(res, "Fetched lecturer analytics overview.", { stats });
  } catch (err) {
    next(err);
  }
};

const getProctoringAuditLogs = async (req, res, next) => {
  try {
    const lecturerId = req.query.lecturerId || req.user.userId;
    const logs = await AnalyticsModel.getProctoringAuditLogs(lecturerId);
    return sendSuccess(res, "Fetched proctoring audit logs.", { logs });
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const lecturerId = req.query.lecturerId || req.user.userId;
    const dashboardData = await AnalyticsModel.getDashboardData(lecturerId);
    return sendSuccess(res, "Fetched lecturer dashboard analytics.", { dashboard: dashboardData });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getProctoringAuditLogs,
  getDashboard,
};
