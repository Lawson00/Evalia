const QuestionModel = require("../models/QuestionModel");
const ClassModel = require("../models/ClassModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const userCanManageTopicClass = async (classId, user) => {
  if (!classId || classId === "all") return true;
  return ClassModel.canManageClass(classId, user);
};

const getTopics = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const canManageClass = await userCanManageTopicClass(classId, req.user);
    if (!canManageClass) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }

    const topics = await QuestionModel.getTopics({ classId, user: req.user });
    return sendSuccess(res, "Fetched topics successfully.", { topics });
  } catch (err) {
    next(err);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const { name, classId, courseCode, description } = req.body;
    if (!name) {
      return sendError(res, "Topic name is required.", null, 400);
    }
    const canManageClass = await userCanManageTopicClass(classId, req.user);
    if (!canManageClass) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }

    const topic = await QuestionModel.createTopic({
      name,
      classId,
      courseCode,
      description,
      lecturerId: req.user?.userId,
      user: req.user,
    });
    return sendSuccess(res, "Topic category created successfully!", { topic }, 201);
  } catch (err) {
    next(err);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const canManageTopic = await QuestionModel.canManageTopic(topicId, req.user);
    if (!canManageTopic) {
      return sendError(res, "Access forbidden for this topic.", null, 403);
    }

    const canManageClass = await userCanManageTopicClass(req.body?.classId, req.user);
    if (!canManageClass) {
      return sendError(res, "Access forbidden for this class.", null, 403);
    }

    const topic = await QuestionModel.updateTopic(topicId, req.body, req.user);
    if (!topic) return sendError(res, "Topic not found.", null, 404);
    return sendSuccess(res, "Topic updated successfully.", { topic });
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const canManageTopic = await QuestionModel.canManageTopic(topicId, req.user);
    if (!canManageTopic) {
      return sendError(res, "Access forbidden for this topic.", null, 403);
    }
    await QuestionModel.deleteTopic(topicId, req.user);
    return sendSuccess(res, "Topic deleted successfully.");
  } catch (err) {
    next(err);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const { topicId, difficulty, search } = req.query;
    if (topicId) {
      const canManageTopic = await QuestionModel.canManageTopic(topicId, req.user);
      if (!canManageTopic) {
        return sendError(res, "Access forbidden for this topic.", null, 403);
      }
    }
    const questions = await QuestionModel.getQuestions({ topicId, difficulty, search, user: req.user });
    return sendSuccess(res, "Fetched questions.", { questions });
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { topicId, questionText, options, correctAnswer, difficulty, explanation, type, points } = req.body;
    if (!questionText || !correctAnswer) {
      return sendError(res, "questionText and correctAnswer are required.", null, 400);
    }
    if (topicId) {
      const canManageTopic = await QuestionModel.canManageTopic(topicId, req.user);
      if (!canManageTopic) {
        return sendError(res, "Access forbidden for this topic.", null, 403);
      }
    }
    const question = await QuestionModel.createQuestion({
      topicId,
      questionText,
      options,
      correctAnswer,
      difficulty,
      explanation,
      type,
      points,
      createdBy: req.user?.userId,
      user: req.user,
    });
    return sendSuccess(res, "Question added to Question Bank!", { question }, 201);
  } catch (err) {
    next(err);
  }
};

const bulkCreateQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return sendError(res, "Questions array is required for bulk creation.", null, 400);
    }
    const created = await QuestionModel.bulkCreateQuestions(questions, req.user);
    return sendSuccess(res, `Successfully saved ${created.length} approved questions to Question Bank!`, { questions: created }, 201);
  } catch (err) {
    next(err);
  }
};

const aiGenerateQuestions = async (req, res, next) => {
  try {
    const { topicId, prompt, imageBase64, pdfBase64, count, difficulty, type, questionType, questionTypes, previewOnly } = req.body;
    const questions = await QuestionModel.generateAIQuestions({
      topicId,
      prompt,
      imageBase64,
      pdfBase64,
      count: count || 5,
      difficulty: difficulty || "mixed",
      questionType: questionType || type || "mixed",
      questionTypes,
      previewOnly: previewOnly !== undefined ? Boolean(previewOnly) : true,
      createdBy: req.user?.userId,
      user: req.user,
    });
    return sendSuccess(
      res,
      previewOnly !== false
        ? `Successfully generated ${questions.length} AI question draft previews for review!`
        : `Successfully auto-generated ${questions.length} AI questions directly to database!`,
      { questions },
      201
    );
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const canManageQuestion = await QuestionModel.canManageQuestion(questionId, req.user);
    if (!canManageQuestion) {
      return sendError(res, "Access forbidden for this question.", null, 403);
    }
    if (req.body?.topicId) {
      const canManageTopic = await QuestionModel.canManageTopic(req.body.topicId, req.user);
      if (!canManageTopic) {
        return sendError(res, "Access forbidden for the target topic.", null, 403);
      }
    }
    const question = await QuestionModel.updateQuestion(questionId, req.body, req.user);
    if (!question) return sendError(res, "Question not found.", null, 404);
    return sendSuccess(res, "Question updated.", { question });
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const canManageQuestion = await QuestionModel.canManageQuestion(questionId, req.user);
    if (!canManageQuestion) {
      return sendError(res, "Access forbidden for this question.", null, 403);
    }
    await QuestionModel.deleteQuestion(questionId, req.user);
    return sendSuccess(res, "Question deleted.");
  } catch (err) {
    next(err);
  }
};

const bulkDeleteQuestions = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return sendError(res, "questionIds array is required for bulk deletion.", null, 400);
    }
    for (const questionId of questionIds) {
      const canManageQuestion = await QuestionModel.canManageQuestion(questionId, req.user);
      if (!canManageQuestion) {
        return sendError(res, "Access forbidden for one or more questions.", null, 403);
      }
    }
    await QuestionModel.bulkDeleteQuestions(questionIds, req.user);
    return sendSuccess(res, `Successfully deleted ${questionIds.length} questions.`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
