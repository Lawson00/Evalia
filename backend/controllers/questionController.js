const QuestionModel = require("../models/QuestionModel");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const getTopics = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const topics = await QuestionModel.getTopics({ classId });
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
    const topic = await QuestionModel.createTopic({ name, classId, courseCode, description });
    return sendSuccess(res, "Topic category created successfully!", { topic }, 201);
  } catch (err) {
    next(err);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const topic = await QuestionModel.updateTopic(topicId, req.body);
    if (!topic) return sendError(res, "Topic not found.", null, 404);
    return sendSuccess(res, "Topic updated successfully.", { topic });
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    await QuestionModel.deleteTopic(topicId);
    return sendSuccess(res, "Topic deleted successfully.");
  } catch (err) {
    next(err);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const { topicId, difficulty, search } = req.query;
    const questions = await QuestionModel.getQuestions({ topicId, difficulty, search });
    return sendSuccess(res, "Fetched questions.", { questions });
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { topicId, questionText, options, correctAnswer, difficulty, explanation } = req.body;
    if (!questionText || !correctAnswer) {
      return sendError(res, "questionText and correctAnswer are required.", null, 400);
    }
    const question = await QuestionModel.createQuestion({
      topicId: topicId || "top-1",
      questionText,
      options,
      correctAnswer,
      difficulty,
      explanation,
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
    const created = await QuestionModel.bulkCreateQuestions(questions);
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
      previewOnly: previewOnly !== undefined ? Boolean(previewOnly) : true, // Default to preview mode for UI review & modification
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
    const question = await QuestionModel.updateQuestion(questionId, req.body);
    if (!question) return sendError(res, "Question not found.", null, 404);
    return sendSuccess(res, "Question updated.", { question });
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    await QuestionModel.deleteQuestion(questionId);
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
    await QuestionModel.bulkDeleteQuestions(questionIds);
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
