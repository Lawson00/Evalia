const express = require("express");
const { getOverview, getProctoringAuditLogs, getDashboard } = require("../controllers/analyticsController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/dashboard", requireRole("lecturer", "admin"), getDashboard);
router.get("/overview", requireRole("lecturer", "admin"), getOverview);
router.get("/proctoring-flags", requireRole("lecturer", "admin"), getProctoringAuditLogs);

module.exports = router;
