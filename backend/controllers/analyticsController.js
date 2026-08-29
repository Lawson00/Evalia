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

module.exports = {
  getOverview,
  getProctoringAuditLogs,
};
