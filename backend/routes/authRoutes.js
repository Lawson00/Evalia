const express = require("express");
const {
  initiateGoogleAuth,
  handleGoogleCallback,
  registerLecturer,
  registerStudent,
  login,
  completeOAuthProfile,
  getCurrentUser,
} = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth 2.0 redirect consent flow
 * @access  Public
 */
router.get("/google", initiateGoogleAuth);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Handle Google OAuth 2.0 callback code & token exchange
 * @access  Public
 */
router.get("/google/callback", handleGoogleCallback);

/**
 * @route   POST /api/v1/auth/register/lecturer
 * @desc    Register a new Lecturer / Admin account
 * @access  Public
 */
router.post("/register/lecturer", registerLecturer);

/**
 * @route   POST /api/v1/auth/register/student
 * @desc    Register a new Student / Candidate account (with indexNumber and courseCode)
 * @access  Public
 */
router.post("/register/student", registerStudent);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Log in Lecturer or Student user
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/v1/auth/google/complete-profile
 * @desc    Complete profile info after Google OAuth signup (phone, indexNumber, department)
 * @access  Public / Authenticated
 */
router.post("/google/complete-profile", completeOAuthProfile);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (JWT Token Required)
 */
router.get("/me", authenticateToken, getCurrentUser);

module.exports = router;
