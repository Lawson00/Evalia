const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const classRoutes = require("./routes/classRoutes");
const questionRoutes = require("./routes/questionRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const aiAdminRoutes = require("./routes/aiAdminRoutes");
const searchRoutes = require("./routes/searchRoutes");
const studentRoutes = require("./routes/studentRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "Evalia Assessment Platform REST API Server",
    version: "v1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API V1 Route Registration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/classes", classRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/assignments", assignmentRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/ai", aiAdminRoutes);
app.use("/api/v1/search", searchRoutes);

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. API endpoint not found.`,
  });
});

// Global Error Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Evalia REST API Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
  const { verifyDatabaseTables } = require("./config/initDatabase");
  await verifyDatabaseTables();
});

module.exports = app;
