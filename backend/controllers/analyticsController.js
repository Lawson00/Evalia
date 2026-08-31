const AnalyticsModel = require("../models/AnalyticsModel");
const { sendSuccess } = require("../utils/responseHandler");

const getOverview = async (req, res, next) => {
  try {
    const stats = await AnalyticsModel.getOverview(req.user.role === "admin" ? null : req.user.userId);
    return sendSuccess(res, "Fetched lecturer analytics overview.", { stats });
  } catch (err) {
    next(err);
  }
};

const getProctoringAuditLogs = async (req, res, next) => {
  try {
    const logs = await AnalyticsModel.getProctoringAuditLogs(req.user.role === "admin" ? null : req.user.userId);
    return sendSuccess(res, "Fetched proctoring audit logs.", { logs });
  } catch (err) {
    next(err);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await AnalyticsModel.getDashboardData(req.user.role === "admin" ? null : req.user.userId);
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
