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
router.get("/topics", getTopics);
router.post("/topics", requireRole("lecturer"), createTopic);
router.put("/topics/:topicId", requireRole("lecturer"), updateTopic);
router.delete("/topics/:topicId", requireRole("lecturer"), deleteTopic);

// Questions & AI Generator Endpoints
router.get("/", getQuestions);
router.post("/", requireRole("lecturer"), createQuestion);
router.post("/bulk", requireRole("lecturer"), bulkCreateQuestions);
router.post("/bulk-delete", requireRole("lecturer"), bulkDeleteQuestions);
router.delete("/bulk", requireRole("lecturer"), bulkDeleteQuestions);
router.post("/ai-generate", requireRole("lecturer"), aiGenerateQuestions);
router.put("/:questionId", requireRole("lecturer"), updateQuestion);
router.delete("/:questionId", requireRole("lecturer"), deleteQuestion);

module.exports = router;
