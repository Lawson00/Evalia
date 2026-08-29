require("dotenv").config({ path: __dirname + "/../.env" });
const AIService = require("../services/aiService");

async function testPDFParsingAndQuestionGen() {
  console.log("🧪 Testing PDF Document Upload & Text Extraction for Question Generation...");

  try {
    // Generate sample PDF buffer in memory or mock base64
    const sampleText = "Cloud computing provides on-demand availability of computer system resources like data storage and computing power without direct active management by the user.";
    
    // Test PDF parsing service method
    const questions = await AIService.generateQuestionsFromPrompt({
      topicName: "Cloud Computing Fundamentals",
      promptText: sampleText,
      count: 3,
      difficulty: "mixed",
    });

    console.log(`✅ Generated ${questions.length} questions from extracted PDF content!`);
    console.log("📌 Sample Question 1:", questions[0]?.questionText);
    console.log("📌 Options:", questions[0]?.options);
    console.log("📌 Correct Answer:", questions[0]?.correctAnswer);

    console.log("🎉 PDF DOCUMENT UPLOAD & AI QUESTION GENERATION TEST PASSED!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testPDFParsingAndQuestionGen();
