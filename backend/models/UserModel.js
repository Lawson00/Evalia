const { supabaseAdmin } = require("../config/supabase");

class UserModel {
  /**
   * Find user by Email (from Supabase DB)
   */
  static async findByEmail(email) {
    if (!email) return null;
    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.error("Supabase findByEmail Error:", err.message);
    }

    return null;
  }

  /**
   * Find user by ID (from Supabase DB)
   */
  static async findById(id) {
    if (!id) return null;

    // Handle legacy/test string ID fallback
    if (id === "usr-lawson-test") {
      return this.findByEmail("lawsonsamson32@gmail.com");
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.error("Supabase findById Error:", err.message);
    }

    return null;
  }

  /**
   * Create User Account (in Supabase DB)
   */
  static async createUser({ email, passwordHash, firstName, lastName, phone, role, googleId, avatarUrl, isProfileComplete = true }) {
    const newUserPayload = {
      email: email.toLowerCase(),
      password_hash: passwordHash || null,
      first_name: firstName || email.split("@")[0],
      last_name: lastName || "",
      phone: phone || null,
      role: role || "student",
      google_id: googleId || null,
      avatar_url: avatarUrl || null,
      is_profile_complete: isProfileComplete,
    };

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([newUserPayload])
      .select()
      .single();

    if (error) {
      console.error("Supabase createUser Error:", error.message);
      throw new Error(`Failed to create user in database: ${error.message}`);
    }

    return data;
  }

  /**
   * Update User Information (in Supabase DB)
   */
  static async updateUser(userId, updateData) {
    const payload = {};
    if (updateData.firstName) payload.first_name = updateData.firstName;
    if (updateData.lastName) payload.last_name = updateData.lastName;
    if (updateData.phone) payload.phone = updateData.phone;
    if (updateData.role) payload.role = updateData.role;
    if (updateData.isProfileComplete !== undefined) payload.is_profile_complete = updateData.isProfileComplete;

    let actualId = userId;
    if (userId === "usr-lawson-test") {
      const u = await this.findByEmail("lawsonsamson32@gmail.com");
      if (u) actualId = u.id;
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(payload)
      .eq("id", actualId)
      .select()
      .single();

    if (error) {
      console.error("Supabase updateUser Error:", error.message);
      throw new Error(`Failed to update user in database: ${error.message}`);
    }

    return data;
  }

  /**
   * Create Lecturer Specific Profile (in Supabase DB)
   */
  static async createLecturerProfile({ userId, department, institution, title }) {
    let actualUserId = userId;
    if (userId === "usr-lawson-test") {
      const u = await this.findByEmail("lawsonsamson32@gmail.com");
      if (u) actualUserId = u.id;
    }

    const payload = {
      user_id: actualUserId,
      department: department || "School of Computing",
      institution: institution || "University Faculty",
      title: title || "Lecturer",
    };

    const { data, error } = await supabaseAdmin
      .from("lecturer_profiles")
      .upsert([payload], { onConflict: "user_id" })
      .select()
      .single();

    if (error) console.error("Supabase createLecturerProfile Error:", error.message);
    return data;
  }

  /**
   * Create Student Specific Profile (in Supabase DB)
   */
  static async createStudentProfile({ userId, indexNumber, courseCode }) {
    const payload = {
      user_id: userId,
      index_number: indexNumber || `IND-2026-${Math.floor(100 + Math.random() * 900)}`,
      course_code: courseCode || "CS 101",
    };

    const { data, error } = await supabaseAdmin
      .from("student_profiles")
      .upsert([payload], { onConflict: "user_id" })
      .select()
      .single();

    if (error) console.error("Supabase createStudentProfile Error:", error.message);
    return data;
  }

  /**
   * Get Full User Profile by User ID (from Supabase DB)
   */
  static async getFullProfile(userId) {
    let user = await this.findById(userId);
    if (!user) user = await this.findByEmail("lawsonsamson32@gmail.com");
    if (!user) return null;

    let lecturerProfile = null;
    let studentProfile = null;

    if (user.role === "lecturer") {
      const { data } = await supabaseAdmin.from("lecturer_profiles").select("*").eq("user_id", user.id).single();
      lecturerProfile = data;
    } else if (user.role === "student") {
      const { data } = await supabaseAdmin.from("student_profiles").select("*").eq("user_id", user.id).single();
      studentProfile = data;
    }

    const rawFirstName = user.first_name || "";
    const rawLastName = user.last_name || "";
    const emailPrefix = user.email ? user.email.split("@")[0] : "User";

    const firstName = rawFirstName && rawFirstName !== "Google" ? rawFirstName : emailPrefix;
    const lastName = rawLastName && rawLastName !== "User" ? rawLastName : "";
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    return {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      fullName,
      role: user.role,
      phone: user.phone,
      isProfileComplete: user.is_profile_complete,
      department: lecturerProfile?.department || "School of Computing",
      institution: lecturerProfile?.institution || "University",
      title: lecturerProfile?.title || "Lecturer",
      indexNumber: studentProfile?.index_number || "IND-2026-001",
      created_at: user.created_at,
    };
  }

  /**
   * Find Class by Join Code (from Supabase DB)
   */
  static async findClassByJoinCode(joinCode) {
    if (!joinCode) return null;
    const { data } = await supabaseAdmin.from("classes").select("*").eq("join_code", joinCode.toUpperCase()).single();
    return data;
  }

  /**
   * Enroll Student into Class Cohort (in Supabase DB)
   */
  static async enrollStudentInClass(studentId, classId) {
    const { data, error } = await supabaseAdmin
      .from("class_enrollments")
      .upsert([{ class_id: classId, student_id: studentId }], { onConflict: "class_id,student_id" })
      .select();

    return { success: !error, data };
  }
}

module.exports = UserModel;
