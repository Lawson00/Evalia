const express = require("express");
const {
  getAssignments,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addRemoveQuestions,
} = require("../controllers/assignmentController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", requireRole("student", "lecturer", "admin"), getAssignments);
router.post("/", requireRole("lecturer", "admin"), createAssignment);
router.get("/:id", requireRole("student", "lecturer", "admin"), getAssignmentById);
router.put("/:id", requireRole("lecturer", "admin"), updateAssignment);
router.delete("/:id", requireRole("lecturer", "admin"), deleteAssignment);
router.post("/:id/questions", requireRole("lecturer", "admin"), addRemoveQuestions);

module.exports = router;
