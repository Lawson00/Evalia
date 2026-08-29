require("dotenv").config({ path: __dirname + "/../.env" });
const QuestionModel = require("../models/QuestionModel");

async function testQuestionBankIntegration() {
  console.log("🧪 Testing Question Bank REST API Model & Supabase Postgres Integration...");

  try {
    // 1. Fetch Topics
    console.log("1️⃣ Fetching topics from Supabase Postgres...");
    const topics = await QuestionModel.getTopics();
    console.log(`✅ Fetched ${topics.length} topics!`);
    if (topics.length > 0) {
      console.log(`📌 Sample Topic: ${topics[0].title} (${topics[0].courseCode}) - ${topics[0].totalQuestions} questions`);
    }

    // 2. Create Test Topic
    console.log("2️⃣ Creating test topic in Supabase Postgres...");
    const testTopic = await QuestionModel.createTopic({
      name: `Automated Test Topic ${Date.now()}`,
      courseCode: "CS 101",
      description: "Testing question bank integration with Supabase Postgres DB.",
    });
    console.log(`✅ Created Topic: ${testTopic.title} (${testTopic.id})`);

    // 3. Add Question to Topic
    console.log("3️⃣ Inserting question into Supabase Postgres...");
    const question = await QuestionModel.createQuestion({
      topicId: testTopic.id,
      questionText: "What is the worst-case time complexity of QuickSort?",
      type: "MCQ",
      options: ["O(n log n)", "O(n²)", "O(n)", "O(1)"],
      correctAnswer: "O(n²)",
      difficulty: "Medium",
      explanation: "Worst-case occurs when the smallest or largest element is always chosen as pivot.",
    });
    console.log(`✅ Inserted Question: "${question.prompt}" (ID: ${question.id})`);

    // 4. Fetch Questions for Topic
    console.log("4️⃣ Re-fetching questions for topic...");
    const questionsList = await QuestionModel.getQuestions({ topicId: testTopic.id });
    console.log(`✅ Found ${questionsList.length} questions in topic ${testTopic.id}!`);

    // 5. Cleanup Test Topic
    console.log("5️⃣ Cleaning up test topic...");
    await QuestionModel.deleteTopic(testTopic.id);
    console.log("✅ Cleanup complete!");

    console.log("🎉 QUESTION BANK REST API & SUPABASE POSTGRES INTEGRATION TEST PASSED!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testQuestionBankIntegration();
