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
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getInvitationLink,
  rotateInvitationLink,
  updateInvitationLink,
  revokeInvitationLink,
} = require("../controllers/classController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/code/:code", getClassByCode);

// All subsequent endpoints require valid token
router.use(authenticateToken);

router.get("/", requireRole("student", "lecturer", "admin"), getClasses);
router.post("/", requireRole("lecturer", "admin"), createClass);
router.post("/enroll", requireRole("student"), enrollStudent);
router.post("/join/:token", requireRole("student"), enrollStudent);
router.get("/:classId", requireRole("student", "lecturer", "admin"), getClassById);
router.put("/:classId/settings", requireRole("lecturer", "admin"), updateClassSettings);
router.delete("/:classId", requireRole("lecturer", "admin"), deleteClass);
router.get("/:classId/invitation", requireRole("lecturer", "admin"), getInvitationLink);
router.post("/:classId/invitation/rotate", requireRole("lecturer", "admin"), rotateInvitationLink);
router.patch("/:classId/invitation", requireRole("lecturer", "admin"), updateInvitationLink);
router.delete("/:classId/invitation", requireRole("lecturer", "admin"), revokeInvitationLink);
router.delete("/:classId/students/:studentId", requireRole("lecturer", "admin"), removeStudent);
router.get("/:classId/students/:studentId", requireRole("student", "lecturer", "admin"), getStudentReport);
router.post("/:classId/students/:studentId/notes", requireRole("lecturer", "admin"), addStudentNote);

// Class Announcements Endpoints
router.get("/:classId/announcements", requireRole("student", "lecturer", "admin"), getAnnouncements);
router.post("/:classId/announcements", requireRole("lecturer", "admin"), createAnnouncement);
router.delete("/:classId/announcements/:announcementId", requireRole("lecturer", "admin"), deleteAnnouncement);

module.exports = router;
