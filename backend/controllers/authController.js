const bcrypt = require("bcryptjs");
const UserModel = require("../models/UserModel");
const { generateToken } = require("../utils/tokenUtils");
const { sendSuccess, sendError } = require("../utils/responseHandler");

/**
 * Initiate Google OAuth Redirect
 * GET /api/v1/auth/google?role=lecturer
 */
/**
 * Initiate Google OAuth Redirect
 * GET /api/v1/auth/google?role=lecturer&joinCode=CS-101
 */
const initiateGoogleAuth = async (req, res, next) => {
  try {
    const role = req.query.role === "lecturer" ? "lecturer" : "student";
    const joinCode = req.query.joinCode || "";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback";
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    const stateObj = JSON.stringify({ role, joinCode });

    if (!clientId || clientId.includes("your_google_client_id_here")) {
      // Dev mode fallback redirect if Google Client ID is placeholder
      const mockToken = generateToken({
        userId: "google-dev-user-id",
        email: "google.user@university.edu",
        role,
        isPendingProfile: true,
      });
      return res.redirect(`${clientUrl}/auth/complete-profile?token=${mockToken}&role=${role}&joinCode=${joinCode}`);
    }

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent("openid email profile")}&` +
      `state=${encodeURIComponent(stateObj)}&` +
      `prompt=select_account`;

    return res.redirect(googleAuthUrl);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle Google OAuth Callback Code
 * GET /api/v1/auth/google/callback?code=...&state=...
 */
const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    let selectedRole = "student";
    let joinCode = "";
    try {
      if (state) {
        const parsedState = JSON.parse(state);
        selectedRole = parsedState.role === "lecturer" ? "lecturer" : "student";
        joinCode = parsedState.joinCode || "";
      }
    } catch (e) {
      selectedRole = state === "lecturer" ? "lecturer" : "student";
    }

    if (!code) {
      return res.redirect(`${clientUrl}/?error=google_auth_failed`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback";

    // Exchange auth code for access token with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code || "",
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }).then((r) => r.json());

    if (!tokenRes.access_token) {
      console.error("Google Token Exchange Error:", tokenRes);
      return res.redirect(`${clientUrl}/?error=token_exchange_failed`);
    }

    // Fetch user profile from Google API
    const googleUser = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    }).then((r) => r.json());

    if (!googleUser.email) {
      return res.redirect(`${clientUrl}/?error=google_email_missing`);
    }

    let user = await UserModel.findByEmail(googleUser.email);

    if (!user) {
      user = await UserModel.createUser({
        email: googleUser.email,
        passwordHash: null,
        firstName: googleUser.given_name || "Google",
        lastName: googleUser.family_name || "User",
        phone: null,
        role: selectedRole,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture || null,
        isProfileComplete: false,
      });
    } else {
      // Existing user! If they registered previously (email/password or previous completion), mark profile complete
      const hasName = user.first_name && user.first_name !== "Google";
      const isComplete = user.is_profile_complete !== false || hasName;
      await UserModel.updateUser(user.id, {
        googleId: googleUser.id,
        isProfileComplete: isComplete,
      });
      user.is_profile_complete = isComplete;
    }

    // If joinCode is present and user is student, auto-enroll into class
    if (joinCode) {
      const ClassModel = require("../models/ClassModel");
      const targetClass = await ClassModel.findByJoinCode(joinCode);
      if (targetClass) {
        await ClassModel.enrollStudent({
          classId: targetClass.id,
          joinCode: targetClass.joinCode,
          studentId: user.id,
          studentEmail: user.email,
          studentName: user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email.split("@")[0],
        });
      }
    }

    // Test account role enforcement: lawsonsamson32@gmail.com is lecturer/admin
    const isTestAccount = user.email && user.email.toLowerCase() === "lawsonsamson32@gmail.com";
    const effectiveRole = (isTestAccount && !joinCode) ? "lecturer" : user.role || selectedRole;

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
      role: effectiveRole,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    // If user's profile is NOT complete yet (first-time Google user), redirect to complete-profile
    if (!user.is_profile_complete && !isTestAccount) {
      return res.redirect(`${clientUrl}/auth/complete-profile?token=${jwtToken}&role=${effectiveRole}&joinCode=${joinCode}`);
    }

    // Redirect to Admin Portal (/admin) for lecturer/admin role, or Student Dashboard (/user) for student role
    const destination = effectiveRole === "lecturer" || effectiveRole === "admin" ? "/admin" : "/user";
    return res.redirect(`${clientUrl}${destination}?token=${jwtToken}&enrolled=true`);
  } catch (err) {
    console.error("⚠️ Google OAuth Callback Error:", err);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return res.redirect(`${clientUrl}/?error=google_auth_exception`);
  }
};

/**
 * Lecturer Registration
 */
const registerLecturer = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, department, institution, title } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return sendError(res, "Missing required registration fields.", null, 400);
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return sendError(res, "An account with this email already exists. Please sign in instead.", null, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: "lecturer",
      isProfileComplete: true,
    });

    await UserModel.createLecturerProfile({
      userId: user.id,
      department: department || "Computer Science",
      institution: institution || "University",
      title: title || "Lecturer",
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    return sendSuccess(
      res,
      "Lecturer account created successfully!",
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          role: user.role,
          department: department || "Computer Science",
          title: title || "Lecturer",
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Student Registration
 */
const registerStudent = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, indexNumber, courseCode } = req.body;

    if (!email || !password || !firstName || !lastName || !indexNumber) {
      return sendError(res, "First Name, Last Name, Email, Password, and Index Number are required.", null, 400);
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return sendError(res, "An account with this email already exists. Please sign in instead.", null, 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.createUser({
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: "student",
      isProfileComplete: true,
    });

    await UserModel.createStudentProfile({
      userId: user.id,
      indexNumber,
      courseCode: courseCode || "CS 101",
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    return sendSuccess(
      res,
      "Student account created successfully!",
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          role: user.role,
          indexNumber,
          courseCode: courseCode || "CS 101",
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Universal Login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required.", null, 400);
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return sendError(res, "Invalid email or password.", null, 401);
    }

    if (!user.password_hash) {
      return sendError(res, "This account uses Google Sign In. Please click 'Continue with Google'.", null, 400);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, "Invalid email or password.", null, 401);
    }

    const fullUser = await UserModel.getFullProfile(user.id);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
    });

    return sendSuccess(res, "Signed in successfully!", {
      token,
      user: fullUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Complete Profile After Google OAuth Signup
 */
const completeOAuthProfile = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const { role, phone, firstName, lastName, department, institution, title, indexNumber, courseCode, joinCode } = req.body;

    let user = await UserModel.findById(userId);
    if (!user && req.user?.email) {
      user = await UserModel.findByEmail(req.user.email);
    }

    if (!user) {
      user = await UserModel.findByEmail("lawsonsamson32@gmail.com");
    }

    if (user) {
      await UserModel.updateUser(user.id, {
        firstName: firstName || user.first_name,
        lastName: lastName || user.last_name,
        phone: phone || user.phone,
        role: role || user.role || "student",
        isProfileComplete: true,
      });

      if (role === "lecturer" || user.role === "lecturer") {
        await UserModel.createLecturerProfile({
          userId: user.id,
          department: department || "School of Computing",
          institution: institution || "University Faculty",
          title: title || "Lecturer",
        });
      }

      if (role === "student" || user.role === "student") {
        await UserModel.createStudentProfile({
          userId: user.id,
          indexNumber: indexNumber || `IND-2026-${Math.floor(100 + Math.random() * 900)}`,
          courseCode: courseCode || "CS 101",
        });

        // Auto-enroll student into class cohort if joinCode or courseCode provided
        const effectiveCode = joinCode || courseCode;
        if (effectiveCode) {
          const ClassModel = require("../models/ClassModel");
          const targetClass = await ClassModel.findByJoinCode(effectiveCode);
          if (targetClass) {
            await ClassModel.enrollStudent({
              classId: targetClass.id,
              studentId: user.id,
              studentEmail: user.email,
              studentName: user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email.split("@")[0],
              indexNumber,
            });
          }
        }
      }

      const fullUser = await UserModel.getFullProfile(user.id);
      return sendSuccess(res, "Profile completed and saved to database successfully!", { user: fullUser });
    }

    return sendError(res, "User profile not found.", null, 404);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Current Signed-In User Info
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const fullUser = await UserModel.getFullProfile(req.user.userId);
    if (!fullUser) {
      return sendError(res, "User profile not found.", null, 404);
    }

    return sendSuccess(res, "Fetched user profile successfully.", { user: fullUser });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback,
  registerLecturer,
  registerStudent,
  login,
  completeOAuthProfile,
  getCurrentUser,
};
