const express = require("express");
const {
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
} = require("../controllers/assignmentController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", requireRole("student", "lecturer", "admin"), getAssignments);
router.get("/student/results", requireRole("student", "lecturer", "admin"), getStudentResults);
router.post("/", requireRole("lecturer", "admin"), createAssignment);
router.get("/attempts/:attemptId", requireRole("student", "lecturer", "admin"), getAttemptResult);
router.get("/:id", requireRole("student", "lecturer", "admin"), getAssignmentById);
router.post("/:id/unlock", requireRole("student"), unlockAssignment);
router.post("/:id/start-attempt", requireRole("student"), startAttempt);
router.post("/:id/proctoring-event", requireRole("student"), logProctoringEvent);
router.post("/:id/submit-attempt", requireRole("student"), submitAttempt);
router.get("/:id/ai-insights", requireRole("lecturer", "admin"), getAssignmentAIInsights);
router.put("/:id", requireRole("lecturer", "admin"), updateAssignment);
router.delete("/:id", requireRole("lecturer", "admin"), deleteAssignment);
router.post("/:id/questions", requireRole("lecturer", "admin"), addRemoveQuestions);

module.exports = router;
