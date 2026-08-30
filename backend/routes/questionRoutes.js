const express = require("express");
const {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getQuestions,
  createQuestion,
  bulkCreateQuestions,
  aiGenerateQuestions,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
} = require("../controllers/questionController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Topics Endpoints
router.get("/topics", requireRole("lecturer", "admin"), getTopics);
router.post("/topics", requireRole("lecturer", "admin"), createTopic);
router.put("/topics/:topicId", requireRole("lecturer", "admin"), updateTopic);
router.delete("/topics/:topicId", requireRole("lecturer", "admin"), deleteTopic);

// Questions & AI Generator Endpoints
router.get("/", requireRole("lecturer", "admin"), getQuestions);
router.post("/", requireRole("lecturer", "admin"), createQuestion);
router.post("/bulk", requireRole("lecturer", "admin"), bulkCreateQuestions);
router.post("/bulk-delete", requireRole("lecturer", "admin"), bulkDeleteQuestions);
router.delete("/bulk", requireRole("lecturer", "admin"), bulkDeleteQuestions);
router.post("/ai-generate", requireRole("lecturer", "admin"), aiGenerateQuestions);
router.put("/:questionId", requireRole("lecturer", "admin"), updateQuestion);
router.delete("/:questionId", requireRole("lecturer", "admin"), deleteQuestion);

module.exports = router;
