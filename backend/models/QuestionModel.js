const { supabaseAdmin } = require("../config/supabase");

const getUserRole = (user) => String(user?.role || "").toLowerCase();
const isAdmin = (user) => getUserRole(user) === "admin";
const isLecturer = (user) => getUserRole(user) === "lecturer";

class QuestionModel {
  /**
   * Helper to parse brackets [phrase] from fill-in-the-blank prompt text
   */
  static parseBlanksFromPrompt(promptText) {
    if (!promptText) return { cleanPrompt: "", blanks: [] };
    const blanks = [];
    const cleanPrompt = promptText.replace(/\[(.*?)\]/g, (_, match) => {
      blanks.push(match.trim());
      return `[blank_${blanks.length}]`;
    });
    return { cleanPrompt, blanks };
  }

  /**
   * Map Supabase topics DB row to camelCase QuestionTopic object
   */
  static mapTopicRow(row, questions = []) {
    if (!row) return null;
    const easyCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length;
    const mediumCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length;
    const hardCount = questions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length;

    const cls = row.classes || {};
    const classId = row.class_id || cls.id || null;
    const className = cls.name || null;
    const courseCode = cls.course_code || row.course_code || "CS 101";
    const courseTitle = cls.name || row.course_title || "Computer Science Fundamentals";

    return {
      id: row.id,
      title: row.name,
      classId,
      className,
      courseCode,
      courseTitle,
      description: row.description || "Core subject topic.",
      totalQuestions: questions.length || 0,
      easyCount,
      mediumCount,
      hardCount,
      enrollmentUsage: Math.floor(Math.random() * 150) + 50,
      createdAt: row.created_at,
    };
  }

  /**
   * Map Supabase questions DB row to BankQuestion object
   */
  static mapQuestionRow(row) {
    if (!row) return null;
    let opts = row.options || [];
    if (typeof opts === "string") {
      try {
        opts = JSON.parse(opts);
      } catch (e) {
        opts = [];
      }
    }

    let blanks = [];
    let detectedType = row.type || "MCQ";

    // Auto-detect fill in the blanks if prompt has [brackets]
    if (row.question_text && row.question_text.includes("[")) {
      detectedType = "fill_in_blank";
      const parsed = this.parseBlanksFromPrompt(row.question_text);
      blanks = parsed.blanks;
    }

    // Format options as array of QuestionOption objects
    const formattedOptions = (Array.isArray(opts) ? opts : []).map((opt, idx) => {
      if (typeof opt === "object" && opt !== null) return opt;
      const optStr = String(opt);
      const isCorrect = row.correct_answer ? optStr === row.correct_answer : idx === 0;
      return {
        id: `opt-${idx + 1}`,
        label: optStr,
        isCorrect,
      };
    });

    if (formattedOptions.length === 0 && (detectedType === "true_false" || detectedType === "trueFalse")) {
      formattedOptions.push(
        { id: "true", label: "True", isCorrect: row.correct_answer === "True" || row.correct_answer === "true" },
        { id: "false", label: "False", isCorrect: row.correct_answer === "False" || row.correct_answer === "false" }
      );
    }

    return {
      id: row.id,
      topicId: row.topic_id,
      prompt: row.question_text || row.prompt || "Question sentence",
      type: detectedType,
      difficulty: (row.difficulty || "Medium").charAt(0).toUpperCase() + (row.difficulty || "Medium").slice(1).toLowerCase(),
      points: Number(row.points) || 2,
      usageCount: Math.floor(Math.random() * 40) + 10,
      explanation: row.explanation || "",
      options: formattedOptions,
      correctAnswer: row.correct_answer || formattedOptions.find((o) => o.isCorrect)?.label || formattedOptions[0]?.label || "",
      blanks,
      createdAt: row.created_at,
    };
  }

  static async resolveLecturerId(user) {
    if (!user) return null;
    if (typeof user === "string") return user;
    if (user.role === "admin") return null;

    let userId = typeof user === "string" ? user : (user.userId || user.id);
    const userEmail = typeof user === "object" ? user.email : null;

    if (userId) {
      const { data: u } = await supabaseAdmin.from("users").select("id").eq("id", userId).single();
      if (u) return u.id;
      userId = null;
    }

    if (!userId && userEmail) {
      const { data: lec } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .single();
      if (lec) return lec.id;
    }

    if (!userId && userEmail) {
      const UserModel = require("./UserModel");
      const newUser = await UserModel.createUser({
        email: userEmail,
        passwordHash: null,
        firstName: user.firstName || userEmail.split("@")[0],
        lastName: user.lastName || "",
        role: user.role || "lecturer",
        isProfileComplete: true,
      });
      if (newUser) return newUser.id;
    }

    const { data: anyUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .in("role", ["lecturer", "admin"])
      .limit(1)
      .single();

    if (anyUser) return anyUser.id;
    return null;
  }

  static async canManageTopic(topicId, user) {
    if (!topicId) return true;
    if (isAdmin(user)) return true;
    if (!isLecturer(user) || !user?.userId) return false;

    const { data, error } = await supabaseAdmin
      .from("topics")
      .select("id, lecturer_id, classes(lecturer_id)")
      .eq("id", topicId)
      .maybeSingle();

    if (error || !data) return false;
    return data.lecturer_id === user.userId || data.classes?.lecturer_id === user.userId;
  }

  static async canManageQuestion(questionId, user) {
    if (isAdmin(user)) return true;
    if (!isLecturer(user) || !user?.userId) return false;

    const { data, error } = await supabaseAdmin
      .from("questions")
      .select("id, created_by, topics(lecturer_id, classes(lecturer_id))")
      .eq("id", questionId)
      .maybeSingle();

    if (error || !data) return false;
    return data.created_by === user.userId ||
      data.topics?.lecturer_id === user.userId ||
      data.topics?.classes?.lecturer_id === user.userId;
  }

  /**
   * Get All Question Bank Topics (Filtered by Lecturer Access)
   */
  static async getTopics({ classId, user } = {}) {
    try {
      const lecturerId = await this.resolveLecturerId(user);
      let query = supabaseAdmin
        .from("topics")
        .select("*, classes(id, name, course_code), questions(*)")
        .order("created_at", { ascending: false });

      if (classId && classId !== "all") {
        query = query.eq("class_id", classId);
      }

      if (lecturerId) {
        query = query.or(`lecturer_id.eq.${lecturerId},lecturer_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data.map((t) => this.mapTopicRow(t, t.questions || []));
      } else if (error) {
        let fallbackQuery = supabaseAdmin
          .from("topics")
          .select("*, questions(*)")
          .order("created_at", { ascending: false });
        if (classId && classId !== "all") {
          fallbackQuery = fallbackQuery.eq("class_id", classId);
        }
        if (lecturerId) {
          fallbackQuery = fallbackQuery.or(`lecturer_id.eq.${lecturerId},lecturer_id.is.null`);
        }
        const { data: fbData } = await fallbackQuery;
        if (fbData) return fbData.map((t) => this.mapTopicRow(t, t.questions || []));
      }
    } catch (err) {
      console.error("Supabase getTopics Error:", err.message);
    }
    return [];
  }

  /**
   * Get Questions for a Topic or Search Criteria (Filtered by Lecturer Access)
   */
  static async getQuestions({ topicId, difficulty, search, user } = {}) {
    try {
      const lecturerId = await this.resolveLecturerId(user);
      let query = supabaseAdmin.from("questions").select("*").order("created_at", { ascending: false });

      if (topicId) query = query.eq("topic_id", topicId);
      if (difficulty && difficulty !== "all") query = query.ilike("difficulty", difficulty);
      if (search) query = query.ilike("question_text", `%${search}%`);

      if (lecturerId) {
        // Fetch topics owned by this lecturer or default system topics
        const { data: userTopics } = await supabaseAdmin
          .from("topics")
          .select("id")
          .or(`lecturer_id.eq.${lecturerId},lecturer_id.is.null`);

        const topicIds = (userTopics || []).map((t) => t.id).filter(Boolean);

        if (topicIds.length > 0) {
          query = query.or(`created_by.eq.${lecturerId},created_by.is.null,topic_id.in.(${topicIds.join(",")})`);
        } else {
          query = query.or(`created_by.eq.${lecturerId},created_by.is.null`);
        }
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((q) => this.mapQuestionRow(q));
      }
    } catch (err) {
      console.error("Supabase getQuestions Error:", err.message);
    }
    return [];
  }

  /**
   * Create New Question Topic (in Supabase DB)
   */
  static async createTopic({ name, classId, courseCode, description, lecturerId, user }) {
    const resolvedLecturerId = await this.resolveLecturerId(user || lecturerId);
    const insertPayload = {
      name,
      description: description || "",
    };
    if (classId) insertPayload.class_id = classId;
    if (courseCode) insertPayload.course_code = courseCode;
    if (resolvedLecturerId) insertPayload.lecturer_id = resolvedLecturerId;

    let data, error;
    try {
      const res = await supabaseAdmin
        .from("topics")
        .insert([insertPayload])
        .select("*, classes(id, name, course_code)")
        .single();
      data = res.data;
      error = res.error;
    } catch (e) {
      delete insertPayload.class_id;
      const res = await supabaseAdmin.from("topics").insert([insertPayload]).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Supabase createTopic Error:", error.message);
      throw new Error(`Failed to create topic in database: ${error.message}`);
    }

    const topicRow = this.mapTopicRow(data, []);
    if (classId) topicRow.classId = classId;
    if (courseCode) topicRow.courseCode = courseCode;
    return topicRow;
  }

  /**
   * Update Topic Details (in Supabase DB)
   */
  static async updateTopic(topicId, { name, classId, courseCode, description }, user) {
    const canManage = await this.canManageTopic(topicId, user);
    if (!canManage) throw new Error("Access forbidden for this topic.");

    const payload = {};
    if (name) payload.name = name;
    if (classId !== undefined) payload.class_id = classId;
    if (description !== undefined) payload.description = description;

    let data, error;
    try {
      const res = await supabaseAdmin
        .from("topics")
        .update(payload)
        .eq("id", topicId)
        .select("*, classes(id, name, course_code)")
        .single();
      data = res.data;
      error = res.error;
    } catch (e) {
      delete payload.class_id;
      const res = await supabaseAdmin.from("topics").update(payload).eq("id", topicId).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) throw new Error(`Failed to update topic: ${error.message}`);

    const { data: questions } = await supabaseAdmin.from("questions").select("id, difficulty").eq("topic_id", topicId);
    const topicRow = this.mapTopicRow(data, questions || []);
    if (classId) topicRow.classId = classId;
    if (courseCode) topicRow.courseCode = courseCode;
    return topicRow;
  }

  /**
   * Delete Topic (from Supabase DB)
   */
  static async deleteTopic(topicId, user = null) {
    if (user) {
      const canManage = await this.canManageTopic(topicId, user);
      if (!canManage) throw new Error("Access forbidden for this topic.");
    }

    const { error } = await supabaseAdmin.from("topics").delete().eq("id", topicId);
    if (error) throw new Error(`Failed to delete topic: ${error.message}`);
    return true;
  }

  /**
   * Create New Question (in Supabase DB) - Supporting All Question Types
   */
  static async createQuestion({ topicId, questionText, prompt, type, options, correctAnswer, difficulty, points, explanation, createdBy, user }) {
    if (topicId && user) {
      const canManageTopic = await this.canManageTopic(topicId, user);
      if (!canManageTopic) throw new Error("Access forbidden for this topic.");
    }

    const cleanPrompt = questionText || prompt;
    let cleanOptions = options;
    let cleanCorrect = correctAnswer;
    const resolvedCreatorId = await this.resolveLecturerId(user || createdBy);

    if (Array.isArray(options) && typeof options[0] === "object") {
      cleanOptions = options.map((o) => o.label);
      const correctObj = options.find((o) => o.isCorrect);
      if (correctObj) cleanCorrect = correctObj.label;
    }

    const insertPayload = {
      question_text: cleanPrompt,
      type: type || "MCQ",
      options: cleanOptions || [],
      correct_answer: cleanCorrect || (Array.isArray(cleanOptions) ? cleanOptions[0] : "Option A"),
      difficulty: (difficulty || "medium").toLowerCase(),
      points: Number(points) || 2,
      explanation: explanation || "",
    };
    if (topicId) insertPayload.topic_id = topicId;
    if (resolvedCreatorId) insertPayload.created_by = resolvedCreatorId;

    let data, error;
    try {
      const res = await supabaseAdmin
        .from("questions")
        .insert([insertPayload])
        .select()
        .single();
      data = res.data;
      error = res.error;
    } catch (e) {
      delete insertPayload.type;
      const res = await supabaseAdmin.from("questions").insert([insertPayload]).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      delete insertPayload.type;
      const res = await supabaseAdmin.from("questions").insert([insertPayload]).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Supabase createQuestion Error:", error.message);
      throw new Error(`Failed to create question in database: ${error.message}`);
    }

    const row = this.mapQuestionRow(data);
    if (type) row.type = type;
    if (points) row.points = Number(points);
    return row;
  }

  /**
   * Auto-generate AI Questions from Prompt, PDF Document, or Image Vision OCR
   * Supports previewOnly mode (returns questions without saving to DB) and questionType selection
   */
  static async generateAIQuestions({ topicId, prompt, imageBase64, pdfBase64, count = 5, difficulty = "mixed", type = "mixed", questionType, questionTypes, previewOnly = false, createdBy }) {
    const AIService = require("../services/aiService");
    const targetType = questionTypes || questionType || type || "mixed";

    let topicName = "Computer Science Fundamentals";
    if (topicId) {
      const { data: topic } = await supabaseAdmin.from("topics").select("name").eq("id", topicId).single();
      if (topic) topicName = topic.name;
    }

    let rawQuestions = [];
    if (pdfBase64) {
      rawQuestions = await AIService.generateQuestionsFromPDF({ topicName, pdfBase64, count, difficulty, questionType: targetType, questionTypes });
    } else if (imageBase64) {
      rawQuestions = await AIService.generateQuestionsFromImage({ topicName, imageBase64, count, difficulty, questionType: targetType, questionTypes });
    } else {
      rawQuestions = await AIService.generateQuestionsFromPrompt({ topicName, promptText: prompt, count, difficulty, questionType: targetType, questionTypes });
    }

    // If previewOnly is requested, format and return without inserting into database
    if (previewOnly) {
      const targetTypesList = AIService.normalizeQuestionTypes(questionType, questionTypes);

      return rawQuestions.map((item, idx) => {
        const expectedType = targetTypesList[idx % targetTypesList.length];
        const detectedType = targetTypesList.length > 1 ? expectedType : (item.type && targetTypesList.includes(item.type) ? item.type : expectedType);

        let opts = item.options || [];
        let formattedOptions = (Array.isArray(opts) ? opts : []).map((opt, oIdx) => {
          const optStr = typeof opt === "object" ? opt.label || String(opt) : String(opt);
          const isCorrect = item.correctAnswer ? optStr === item.correctAnswer : oIdx === 0;
          return { id: `opt-${oIdx + 1}`, label: optStr, isCorrect };
        });

        if (detectedType === "true_false") {
          const isTrue = String(item.correctAnswer).toLowerCase() === "true" || item.correctAnswer === true;
          formattedOptions = [
            { id: "true", label: "True", isCorrect: isTrue },
            { id: "false", label: "False", isCorrect: !isTrue },
          ];
        }

        let questionPrompt = item.questionText || item.prompt || `AI Question #${idx + 1}`;
        if (detectedType === "fill_in_blank" && !questionPrompt.includes("[")) {
          const targetWord = item.correctAnswer || (formattedOptions[0] ? formattedOptions[0].label : "concept");
          if (targetWord && questionPrompt.includes(targetWord)) {
            questionPrompt = questionPrompt.replace(targetWord, `[${targetWord}]`);
          } else {
            questionPrompt = `${questionPrompt} [${targetWord || "term"}]`;
          }
        }

        return {
          id: `preview-ai-${Date.now()}-${idx + 1}`,
          topicId: topicId || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          prompt: questionPrompt,
          type: detectedType,
          difficulty: (item.difficulty || difficulty || "Medium").charAt(0).toUpperCase() + (item.difficulty || difficulty || "Medium").slice(1).toLowerCase(),
          points: Number(item.points) || 2,
          explanation: item.explanation || "",
          options: formattedOptions,
          correctAnswer: item.correctAnswer || formattedOptions.find((o) => o.isCorrect)?.label || formattedOptions[0]?.label || "",
        };
      });
    }

    const createdQuestions = [];
    for (const item of rawQuestions) {
      const q = await this.createQuestion({
        topicId: topicId || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        questionText: item.questionText,
        type: item.type || targetType || "MCQ",
        options: item.options,
        correctAnswer: item.correctAnswer,
        difficulty: item.difficulty || "medium",
        points: item.points || 2,
        explanation: item.explanation || "",
        createdBy,
      });
      createdQuestions.push(q);
    }

    return createdQuestions;
  }

  /**
   * Bulk Create Approved Questions in Database (after user preview & modification)
   */
  static async bulkCreateQuestions(questions = [], userObj = null) {
    const created = [];
    const creatorId = typeof userObj === "object" ? await this.resolveLecturerId(userObj) : userObj;
    for (const item of questions) {
      const q = await this.createQuestion({
        topicId: item.topicId,
        questionText: item.prompt || item.questionText,
        type: item.type || "MCQ",
        options: item.options,
        correctAnswer: item.correctAnswer,
        difficulty: item.difficulty,
        points: item.points || 2,
        explanation: item.explanation || "",
        createdBy: item.createdBy || creatorId,
      });
      created.push(q);
    }
    return created;
  }

  /**
   * Update Question in Supabase DB
   */
  static async updateQuestion(questionId, updates, user = null) {
    if (user) {
      const canManage = await this.canManageQuestion(questionId, user);
      if (!canManage) throw new Error("Access forbidden for this question.");
    }

    const payload = {};
    if (updates.prompt || updates.questionText) payload.question_text = updates.prompt || updates.questionText;
    if (updates.topicId !== undefined) payload.topic_id = updates.topicId;
    if (updates.type) payload.type = updates.type;
    if (updates.options) {
      if (Array.isArray(updates.options) && typeof updates.options[0] === "object") {
        payload.options = updates.options.map((o) => o.label);
        const correctObj = updates.options.find((o) => o.isCorrect);
        if (correctObj) payload.correct_answer = correctObj.label;
      } else {
        payload.options = updates.options;
      }
    }
    if (updates.correctAnswer) payload.correct_answer = updates.correctAnswer;
    if (updates.difficulty) payload.difficulty = updates.difficulty.toLowerCase();
    if (updates.points !== undefined) payload.points = Number(updates.points);
    if (updates.explanation !== undefined) payload.explanation = updates.explanation;

    const { data, error } = await supabaseAdmin
      .from("questions")
      .update(payload)
      .eq("id", questionId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update question: ${error.message}`);

    const row = this.mapQuestionRow(data);
    if (updates.type) row.type = updates.type;
    if (updates.points) row.points = Number(updates.points);
    return row;
  }

  /**
   * Delete Question from Supabase DB
   */
  static async deleteQuestion(questionId, user = null) {
    if (user) {
      const canManage = await this.canManageQuestion(questionId, user);
      if (!canManage) throw new Error("Access forbidden for this question.");
    }

    const { error } = await supabaseAdmin.from("questions").delete().eq("id", questionId);
    if (error) throw new Error(`Failed to delete question: ${error.message}`);
    return true;
  }

  /**
   * Bulk Delete Questions from Supabase DB
   */
  static async bulkDeleteQuestions(questionIds, user = null) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) return true;
    if (user && !isAdmin(user)) {
      for (const questionId of questionIds) {
        const canManage = await this.canManageQuestion(questionId, user);
        if (!canManage) throw new Error("Access forbidden for one or more questions.");
      }
    }
    const { error } = await supabaseAdmin.from("questions").delete().in("id", questionIds);
    if (error) throw new Error(`Failed to bulk delete questions: ${error.message}`);
    return true;
  }
}

module.exports = QuestionModel;
