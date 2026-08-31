const express = require("express");
const { getDashboard } = require("../controllers/studentDashboardController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/dashboard", requireRole("student"), getDashboard);

module.exports = router;
