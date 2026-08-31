const StudentDashboardModel = require("../models/StudentDashboardModel");
const { sendSuccess } = require("../utils/responseHandler");

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await StudentDashboardModel.getDashboard(req.user);
    return sendSuccess(res, "Fetched student dashboard from database.", { dashboard });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
};
