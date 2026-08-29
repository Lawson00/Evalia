const express = require("express");
const { globalSearch } = require("../controllers/searchController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", requireRole("lecturer", "admin"), globalSearch);

module.exports = router;
