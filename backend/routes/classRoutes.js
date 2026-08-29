const express = require("express");
const {
  getClasses,
  createClass,
  getClassById,
  getClassByCode,
  updateClassSettings,
  deleteClass,
  enrollStudent,
  removeStudent,
  getStudentReport,
  addStudentNote,
} = require("../controllers/classController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public route to preview class by invite join code
router.get("/code/:code", getClassByCode);

// All subsequent endpoints require valid token
router.use(authenticateToken);

router.get("/", requireRole("student", "lecturer", "admin"), getClasses);
router.post("/", requireRole("lecturer", "admin"), createClass);
router.post("/enroll", requireRole("student"), enrollStudent);
router.get("/:classId", requireRole("student", "lecturer", "admin"), getClassById);
router.put("/:classId/settings", requireRole("lecturer", "admin"), updateClassSettings);
router.delete("/:classId", requireRole("lecturer", "admin"), deleteClass);
router.delete("/:classId/students/:studentId", requireRole("lecturer", "admin"), removeStudent);
router.get("/:classId/students/:studentId", requireRole("student", "lecturer", "admin"), getStudentReport);
router.post("/:classId/students/:studentId/notes", requireRole("lecturer", "admin"), addStudentNote);

module.exports = router;
