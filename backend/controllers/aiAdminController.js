const AIService = require("../services/aiService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

const enhanceQuestion = async (req, res, next) => {
  try {
    const { questionText, options, correctAnswer, difficulty } = req.body;
    if (!questionText) {
      return sendError(res, "questionText is required.", null, 400);
    }
    const result = await AIService.enhanceQuestion({ questionText, options, correctAnswer, difficulty });
    return sendSuccess(res, "Question enhanced successfully via OpenAI!", { enhanced: result });
  } catch (err) {
    next(err);
  }
};

const getClassMasteryInsights = async (req, res, next) => {
  try {
    const { className, averageScore, studentCount } = req.body;
    const insights = await AIService.analyzeClassCohortMastery({ className, averageScore, studentCount });
    return sendSuccess(res, "Class cohort mastery insights generated.", { insights });
  } catch (err) {
    next(err);
  }
};

const getStudentRemediation = async (req, res, next) => {
  try {
    const { studentName, indexNumber, earnedPoints, totalClassPoints } = req.body;
    const remediation = await AIService.generateStudentRemediation({
      studentName,
      indexNumber,
      earnedPoints,
      totalClassPoints,
    });
    return sendSuccess(res, "Student remediation study plan generated.", { remediation });
  } catch (err) {
    next(err);
  }
};

const getProctoringIntegrityAnalysis = async (req, res, next) => {
  try {
    const { studentName, flagCount } = req.body;
    const analysis = await AIService.analyzeProctoringIntegrity({ studentName, flagCount });
    return sendSuccess(res, "Proctoring integrity analysis generated.", { analysis });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  enhanceQuestion,
  getClassMasteryInsights,
  getStudentRemediation,
  getProctoringIntegrityAnalysis,
};
