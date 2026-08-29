const express = require("express");
const {
  enhanceQuestion,
  getClassMasteryInsights,
  getStudentRemediation,
  getProctoringIntegrityAnalysis,
} = require("../controllers/aiAdminController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post("/enhance-question", requireRole("lecturer"), enhanceQuestion);
router.post("/class-mastery-insights", requireRole("lecturer"), getClassMasteryInsights);
router.post("/student-remediation", requireRole("lecturer"), getStudentRemediation);
router.post("/proctoring-integrity", requireRole("lecturer"), getProctoringIntegrityAnalysis);

module.exports = router;
