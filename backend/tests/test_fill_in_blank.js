require("dotenv").config({ path: __dirname + "/../.env" });
const QuestionModel = require("../models/QuestionModel");

async function testFillInBlankQuestion() {
  console.log("🧪 Testing Fill-in-the-Blanks (Gap Fill) Question Creation & Parsing...");

  try {
    // 1. Create Test Topic
    const topic = await QuestionModel.createTopic({
      name: `Gap Fill Test Topic ${Date.now()}`,
      courseCode: "CS 101",
      description: "Testing fill in the blanks mode.",
    });
    console.log(`✅ Created Topic: ${topic.title} (${topic.id})`);

    // 2. Insert Fill-in-the-Blank Question
    const gapFillQuestionText = "The CPU stands for [Central Processing Unit] and RAM stands for [Random Access Memory].";
    console.log(`⚙️ Inserting Gap Fill Question: "${gapFillQuestionText}"...`);

    const q = await QuestionModel.createQuestion({
      topicId: topic.id,
      questionText: gapFillQuestionText,
      type: "fill_in_blank",
      difficulty: "medium",
      points: 4,
      explanation: "CPU and RAM are fundamental hardware components of computer architecture.",
    });

    console.log("✅ Inserted Fill in Blank Question! DB ID:", q.id);
    console.log("📌 Parsed Question Type:", q.type);
    console.log("📌 Parsed Blanks Array:", q.blanks);

    if (!q.blanks || q.blanks.length !== 2 || q.blanks[0] !== "Central Processing Unit" || q.blanks[1] !== "Random Access Memory") {
      throw new Error(`Parsed blanks mismatch! Received: ${JSON.stringify(q.blanks)}`);
    }

    // 3. Cleanup Test Topic
    await QuestionModel.deleteTopic(topic.id);
    console.log("✅ Cleaned up test topic!");

    console.log("🎉 FILL IN THE BLANKS (GAP FILL) QUESTION MODE TEST PASSED!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testFillInBlankQuestion();
