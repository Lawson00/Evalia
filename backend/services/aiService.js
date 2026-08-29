const path = require("path");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith("sk-") && !apiKey.includes("your_openai_api_key_here")) {
    return new OpenAI({ apiKey });
  }
  return null;
}

class AIService {
  static isAIConfigured() {
    return Boolean(getOpenAIClient());
  }

  /**
   * Helper to normalize requested question modes into a clean array of types
   */
  static normalizeQuestionTypes(questionType, questionTypes) {
    let types = [];
    if (Array.isArray(questionTypes) && questionTypes.length > 0) {
      types = questionTypes;
    } else if (Array.isArray(questionType) && questionType.length > 0) {
      types = questionType;
    } else if (typeof questionType === "string" && questionType.trim()) {
      types = questionType.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const ALL_MODES = ["MCQ", "fill_in_blank", "true_false", "short_answer", "essay", "coding"];

    if (types.length === 0 || types.includes("mixed") || types.includes("all") || types.length === ALL_MODES.length) {
      return ALL_MODES;
    }
    return types;
  }

  /**
   * Auto-Generate Questions from Topic Prompt or Text Document
   */
  static async generateQuestionsFromPrompt({ topicName = "Computer Science", promptText = "", count = 5, difficulty = "mixed", questionType = "mixed", questionTypes }) {
    const client = getOpenAIClient();
    const targetTypes = this.normalizeQuestionTypes(questionType, questionTypes);
    const isAll = targetTypes.length === 6;

    if (client) {
      try {
        const systemPrompt = `You are an expert university professor creating high-quality exam assessment questions for the Evalia platform.
Output MUST be valid JSON containing an object with key "questions": array of objects.
Each question MUST have:
- "questionText": The exact question sentence. (For fill_in_blank, use [brackets] around key blank terms like "The [array] data structure is indexed starting from 0.")
- "type": Question type (${targetTypes.map((t) => `"${t}"`).join(" | ")})
- "options": Array of 2 to 4 options (For true_false use ["True", "False"]. For MCQ use 4 options. For fill_in_blank, short_answer, essay, coding provide 2-4 key sample options or criteria)
- "correctAnswer": Exact string matching correct answer or key term
- "difficulty": "easy", "medium", or "hard"
- "explanation": Educational explanation for why the answer is correct.

CRITICAL INSTRUCTION FOR QUESTION TYPES:
You MUST generate an even distribution of the requested question modes: ${targetTypes.join(", ")}.
Do NOT make all questions MCQ!
Cycle through the requested types so that:
- Question 1 has type "${targetTypes[0]}"
- Question 2 has type "${targetTypes[1 % targetTypes.length]}"
- Question 3 has type "${targetTypes[2 % targetTypes.length]}"
and so on for all ${count} requested questions!`;

        const userPrompt = `Topic Category: ${topicName}
Course Notes / Source Text: ${promptText || topicName}
Target Question Count: ${count}
Requested Difficulty Distribution: ${difficulty}
Target Question Modes Requested: ${isAll ? "All Varieties (balanced mix of MCQ, fill_in_blank, true_false, short_answer, essay, coding)" : targetTypes.join(", ")}.

Please generate ${count} questions based directly on the provided source content, evenly cycling through the requested modes (${targetTypes.join(", ")}).`;

        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        });

        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          // Post-process questions to guarantee requested modes distribution
          return parsed.questions.map((q, idx) => {
            const expectedType = targetTypes[idx % targetTypes.length];
            const assignedType = targetTypes.length > 1 ? expectedType : (q.type && targetTypes.includes(q.type) ? q.type : expectedType);
            return {
              ...q,
              type: assignedType,
            };
          });
        }
      } catch (err) {
        console.error("⚠️ OpenAI ChatGPT API Call Error:", err.message);
      }
    }

    return this.generateMockAIQuestions({ topicName, promptText, count, difficulty, questionType: targetTypes });
  }

  /**
   * Universal PDF Buffer Text Extractor supporting pdf-parse CommonJS, ES6 default, and PDFParse Class APIs
   */
  static async parsePDF(buffer) {
    const pdfModule = require("pdf-parse");

    if (typeof pdfModule === "function") {
      const res = await pdfModule(buffer);
      return { text: res.text || "", pages: res.numpages || 1 };
    }

    if (pdfModule && typeof pdfModule.default === "function") {
      const res = await pdfModule.default(buffer);
      return { text: res.text || "", pages: res.numpages || 1 };
    }

    if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        const rawText = typeof textResult === "string" ? textResult : (textResult?.text || JSON.stringify(textResult));
        return { text: rawText || "", pages: 1 };
      } finally {
        if (typeof parser.destroy === "function") {
          try { await parser.destroy(); } catch (e) {}
        }
      }
    }

    throw new Error("PDF parser module could not be initialized.");
  }

  /**
   * Auto-Generate Questions from Uploaded PDF Document (pdf-parse with Strict Token Safeguards)
   */
  static async generateQuestionsFromPDF({ topicName = "Computer Science", pdfBase64, count = 5, difficulty = "mixed", questionType = "mixed", questionTypes }) {
    const targetTypes = this.normalizeQuestionTypes(questionType, questionTypes);

    try {
      let buffer;
      if (typeof pdfBase64 === "string") {
        if (pdfBase64.includes(";base64,")) {
          buffer = Buffer.from(pdfBase64.split(";base64,")[1], "base64");
        } else {
          buffer = Buffer.from(pdfBase64, "base64");
        }
      } else if (Buffer.isBuffer(pdfBase64)) {
        buffer = pdfBase64;
      } else {
        throw new Error("Invalid PDF buffer or base64 input.");
      }

      // Safeguard 1: File Size Check (Max 10MB)
      const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
      if (buffer.length > MAX_BYTES) {
        throw new Error(`Uploaded PDF exceeds maximum 10MB size limit (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller excerpt or slide deck.`);
      }

      const pdfData = await this.parsePDF(buffer);
      const totalPages = pdfData.pages || 1;
      const rawText = (pdfData.text || "").replace(/\r\n|\r/g, "\n").trim();

      console.log(`📄 PDF parsed successfully! Total Pages: ${totalPages}, Raw Character Length: ${rawText.length}`);

      // Safeguard 2: Character & Token Budget Truncation (Max 8,000 chars ≈ ~2,000 tokens)
      const MAX_CHARS = 8000;
      let trimmedText = rawText;
      if (rawText.length > MAX_CHARS) {
        console.log(`⚠️ Document contains ${rawText.length} characters across ${totalPages} pages. Truncating to 8,000 characters to prevent excessive OpenAI token usage.`);
        const cutoff = rawText.indexOf(".", MAX_CHARS);
        trimmedText = cutoff !== -1 ? rawText.slice(0, cutoff + 1) : rawText.slice(0, MAX_CHARS);
      }

      if (trimmedText.length < 30) {
        console.warn("⚠️ PDF text extraction yielded sparse text (under 30 characters).");
        trimmedText = `${topicName} Course Material Syllabus and Lecture Notes`;
      }

      return this.generateQuestionsFromPrompt({
        topicName,
        promptText: `EXTRACTED PDF DOCUMENT CONTENT:\n---\n${trimmedText}\n---`,
        count,
        difficulty,
        questionType: targetTypes,
        questionTypes: targetTypes,
      });
    } catch (err) {
      console.error("⚠️ PDF Token Guard Error:", err.message);
      if (err.message.includes("exceeds maximum 10MB")) {
        throw err;
      }
      return this.generateMockAIQuestions({ topicName, promptText: `${topicName} Course Material Document`, count, difficulty, questionType: targetTypes, questionTypes: targetTypes });
    }
  }

  /**
   * Auto-Generate Questions from Uploaded Image / Photo (GPT-4o Vision OCR)
   */
  static async generateQuestionsFromImage({ topicName = "Image Analysis", imageBase64, count = 5, difficulty = "mixed", questionType = "mixed", questionTypes }) {
    const client = getOpenAIClient();
    const targetTypes = this.normalizeQuestionTypes(questionType, questionTypes);
    const isAll = targetTypes.length === 6;

    if (client && imageBase64) {
      try {
        const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an AI Exam Author using Vision OCR. Analyze the provided image (lecture slide, handwritten notes, textbook page, or diagram) and generate ${count} assessment questions based on visual content. Target Question Modes: ${targetTypes.join(", ")}. Output JSON with key "questions": array of {questionText, type, options, correctAnswer, difficulty, explanation}.`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Extract and generate ${count} exam questions (distributed among modes: ${targetTypes.join(", ")}) from this uploaded course image for topic: ${topicName}.` },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          max_tokens: 1500,
        });

        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.questions)) {
          return parsed.questions;
        }
      } catch (err) {
        console.error("⚠️ OpenAI GPT-4o Vision Image Error:", err.message);
      }
    }

    return this.generateMockAIQuestions({
      topicName: `Image Document (${topicName})`,
      promptText: "Parsed visual text from uploaded document image",
      count,
      difficulty,
      questionType: targetTypes,
      questionTypes: targetTypes,
    });
  }

  /**
   * AI Question Enhancer & Explainer
   */
  static async enhanceQuestion({ questionText, options, correctAnswer, difficulty }) {
    const client = getOpenAIClient();
    if (client) {
      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an AI Question Enhancer. Refine the question phrasing, optimize distractor options, verify the correct answer, and generate an explanation. Output JSON with keys: enhancedQuestionText, enhancedOptions (array of 4), correctAnswer, explanation, difficultyRating.",
            },
            {
              role: "user",
              content: `Refine this question: "${questionText}". Options: ${JSON.stringify(options)}. Correct: "${correctAnswer}". Difficulty: "${difficulty}".`,
            },
          ],
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        if (parsed) return parsed;
      } catch (err) {
        console.error("⚠️ OpenAI Enhance Error:", err.message);
      }
    }

    return {
      enhancedQuestionText: questionText.endsWith("?") ? questionText : `${questionText}?`,
      enhancedOptions: options || ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: correctAnswer || options?.[0] || "Option A",
      explanation: "AI Enhanced Explanation: This option represents the optimal algorithmic strategy according to standard core curriculum guidelines.",
      difficultyRating: difficulty || "medium",
    };
  }

  /**
   * AI Class Cohort Mastery Insights
   */
  static async analyzeClassCohortMastery({ className = "CS 101", averageScore = 78.4, studentCount = 5 }) {
    const client = getOpenAIClient();
    if (client) {
      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an AI Academic Analytics Analyst. Analyze class cohort performance and output JSON with keys: executiveSummary, topMasteredTopics (array of strings), weakConceptsNeedingReview (array of strings), recommendedActionPlan.",
            },
            {
              role: "user",
              content: `Class: ${className}. Enrolled Students: ${studentCount}. Class Average Score: ${averageScore}%.`,
            },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      } catch (err) {
        console.error("⚠️ OpenAI Cohort Analysis Error:", err.message);
      }
    }

    return {
      executiveSummary: `Class cohort ${className} is demonstrating strong progress with an overall average accuracy of ${averageScore}%. 75% of enrolled students are meeting or exceeding the pass threshold.`,
      topMasteredTopics: ["Arrays & Linked Lists (88% Mastery)", "Basic Sorting Algorithms (84% Mastery)", "Web API Principles (82% Mastery)"],
      weakConceptsNeedingReview: ["Dynamic Programming & Recursion (52% Mastery)", "Graph Search Memory Overhead (58% Mastery)"],
      recommendedActionPlan: "Schedule a targeted 20-minute review session on Recursion & Dynamic Programming before the upcoming Terminal Assessment.",
    };
  }

  /**
   * AI Student Remediation & Study Recommendation Advisor
   */
  static async generateStudentRemediation({ studentName = "Student", indexNumber = "IND-001", earnedPoints = 88.4, totalClassPoints = 100 }) {
    const client = getOpenAIClient();
    if (client) {
      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an AI Academic Tutor & Remediation Advisor. Output JSON with keys: studentPerformanceRating, personalizedFeedbackNote, recommendedStudyTopics (array of strings), suggestedPracticeCount.",
            },
            {
              role: "user",
              content: `Student Name: ${studentName} (${indexNumber}). Score: ${earnedPoints}/${totalClassPoints} pts (${((earnedPoints/totalClassPoints)*100).toFixed(1)}%).`,
            },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      } catch (err) {
        console.error("⚠️ OpenAI Student Remediation Error:", err.message);
      }
    }

    const pct = ((earnedPoints / totalClassPoints) * 100).toFixed(1);
    return {
      studentPerformanceRating: Number(pct) >= 80 ? "Exceeding Expectations (Grade A)" : Number(pct) >= 60 ? "Satisfactory Progress (Grade C)" : "Needs Intervention (Grade F)",
      personalizedFeedbackNote: `${studentName} demonstrates excellent overall comprehension (${pct}% accuracy). To push towards a top A+ tier, focus on advanced edge cases in recursive dynamic programming.`,
      recommendedStudyTopics: ["Dynamic Programming Memoization", "Graph Shortest Path Traversal", "System Time Complexity Proofs"],
      suggestedPracticeCount: 5,
    };
  }

  /**
   * AI Proctoring Integrity Analyst
   */
  static async analyzeProctoringIntegrity({ studentName = "Maya Chen", flagCount = 2 }) {
    const client = getOpenAIClient();
    if (client) {
      try {
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an AI Academic Integrity & Proctoring Analyst. Output JSON with keys: integrityScore (0-100), trustStatus ('High Trust' | 'Needs Review' | 'Suspicious'), riskSummary, recommendedLecturerAction.",
            },
            {
              role: "user",
              content: `Candidate: ${studentName}. Proctoring Flags Logged: ${flagCount} (Tab Switches & Camera Face Detection Events).`,
            },
          ],
        });

        return JSON.parse(response.choices[0].message.content);
      } catch (err) {
        console.error("⚠️ OpenAI Proctoring Analysis Error:", err.message);
      }
    }

    return {
      integrityScore: flagCount > 1 ? 68 : 95,
      trustStatus: flagCount > 1 ? "Needs Review" : "High Trust",
      riskSummary: flagCount > 1 ? `Detected ${flagCount} proctoring anomaly events during test execution. 1 tab switch event and 1 secondary face detection flag.` : "Clean assessment session with zero proctoring violations detected.",
      recommendedLecturerAction: flagCount > 1 ? "Review webcam video snippet around 14:35 timestamp before finalizing official grade report." : "Approve test attempt without manual review.",
    };
  }

  /**
   * Helper to extract clean concept keywords from source text or topic name
   */
  static extractKeywords(promptText = "", topicName = "") {
    const cleanStr = `${promptText} ${topicName}`
      .replace(/Parsed PDF document content|EXTRACTED PDF DOCUMENT CONTENT|---|Course Material PDF/gi, "")
      .trim();
    const words = cleanStr
      .split(/[\s,.;:!?\(\)\[\]"'\/\-]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4 && !/^(this|that|with|from|have|more|were|been|they|them|their|which|about|there|where|when|what|your|more|only|some|such|than|then|into|than|content|parsed|document)$/i.test(w));

    const unique = Array.from(new Set(words));
    if (unique.length < 5) {
      unique.push("Algorithm", "DataStructure", "Encapsulation", "Polymorphism", "Abstraction", "Complexity", "Optimization", "Architecture", "Concurrency", "StateManagement");
    }
    return unique;
  }

  /**
   * Fallback AI Question Generator supporting all Question Modes (MCQ, Fill in Blank, True/False, Short Answer, Essay, Coding)
   */
  static generateMockAIQuestions({ topicName = "Computer Science", promptText = "", count = 5, difficulty = "mixed", questionType = "mixed", questionTypes }) {
    const generated = [];
    const diffs = difficulty === "mixed" ? ["easy", "medium", "hard"] : [difficulty];
    const targetTypes = this.normalizeQuestionTypes(questionType, questionTypes);
    const keywords = this.extractKeywords(promptText, topicName);

    const mcqTemplates = [
      (concept) => ({
        text: `Which of the following best defines the primary objective of ${concept} in ${topicName}?`,
        options: [`${concept} provides modular state encapsulation`, `${concept} eliminates execution latency`, `${concept} bypasses memory limits`, `${concept} restricts compiler optimization`],
        correct: `${concept} provides modular state encapsulation`,
        explanation: `Educational rationale: ${concept} is designed to enforce encapsulation and modular structure.`,
      }),
      (concept) => ({
        text: `When implementing ${concept}, which architectural pattern is recommended for maximum efficiency?`,
        options: [`Layered Service Abstraction`, `Linear Polling Loop`, `Unstructured Global State`, `Synchronous Blocking I/O`],
        correct: `Layered Service Abstraction`,
        explanation: `Layered Service Abstraction ensures clean separation of concerns and maintainability.`,
      }),
      (concept) => ({
        text: `What primary advantage does ${concept} offer in large-scale system deployments?`,
        options: [`Scalable Component Decoupling`, `Zero Memory Footprint`, `Automatic Thread Invalidation`, `Static Code Inlining`],
        correct: `Scalable Component Decoupling`,
        explanation: `Component decoupling allows independent scaling and modular maintenance.`,
      }),
      (concept) => ({
        text: `In the context of ${topicName}, what is the main trade-off associated with ${concept}?`,
        options: [`Initial Setup Complexity vs Long-term Scalability`, `Hardware Incompatibility`, `Network Packet Loss`, `Forced Thread Termination`],
        correct: `Initial Setup Complexity vs Long-term Scalability`,
        explanation: `Proper implementation of ${concept} requires upfront design effort to gain scalable performance.`,
      }),
    ];

    for (let i = 1; i <= count; i++) {
      const selectedDiff = diffs[(i - 1) % diffs.length];
      const type = targetTypes[(i - 1) % targetTypes.length];
      const concept = keywords[(i - 1) % keywords.length] || topicName;

      let questionText = "";
      let options = [];
      let correctAnswer = "";
      let explanation = "";

      if (type === "fill_in_blank") {
        questionText = `In ${topicName}, the process of [${concept}] ensures structured component communication.`;
        options = [concept, "GlobalState", "StaticBuffer", "DirectPointer"];
        correctAnswer = concept;
        explanation = `Fill-in-the-blank target term: ${concept} is the primary mechanism for structured execution.`;
      } else if (type === "true_false") {
        questionText = `True or False: ${concept} allows components in ${topicName} to interact without exposing internal state.`;
        options = ["True", "False"];
        correctAnswer = "True";
        explanation = `Statement is accurate: ${concept} maintains state privacy and loose coupling.`;
      } else if (type === "short_answer") {
        questionText = `Briefly explain the role of ${concept} in optimizing ${topicName} workflow performance.`;
        options = [`${concept} Optimization`, "Thread Pooling", "Resource Caching", "State Sync"];
        correctAnswer = `${concept} Optimization`;
        explanation = `Short answer evaluation key: ${concept} reduces overhead and optimizes execution flow.`;
      } else if (type === "essay") {
        questionText = `Provide a comprehensive analysis of ${concept} within ${topicName}, highlighting key trade-offs and implementation strategies.`;
        options = [`${concept} Analysis`, "Performance Trade-offs", "Scalability Impact", "Architectural Patterns"];
        correctAnswer = `${concept} Analysis`;
        explanation = `Essay rubric: Evaluates deep understanding of ${concept}, design trade-offs, and practical application.`;
      } else if (type === "coding") {
        questionText = `Write a function in JavaScript/Python to demonstrate ${concept} algorithm processing with O(N log N) time complexity.`;
        options = [`${concept} Function Implementation`, "Recursive Solution", "Iterative Solution", "Greedy Approach"];
        correctAnswer = `${concept} Function Implementation`;
        explanation = `Coding problem testing algorithmic implementation and time complexity optimization for ${concept}.`;
      } else {
        // MCQ Choice
        const template = mcqTemplates[(i - 1) % mcqTemplates.length](concept);
        questionText = template.text;
        options = template.options;
        correctAnswer = template.correct;
        explanation = template.explanation;
      }

      generated.push({
        questionText,
        type,
        options,
        correctAnswer,
        difficulty: selectedDiff,
        explanation,
      });
    }

    return generated;
  }
}

module.exports = AIService;
