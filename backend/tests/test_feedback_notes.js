require("dotenv").config({ path: __dirname + "/../.env" });
const ClassModel = require("../models/ClassModel");
const { supabaseAdmin } = require("../config/supabase");

async function testFeedbackNotesPersistence() {
  console.log("🧪 Testing Lecturer Feedback Notes Persistence in Supabase Postgres...");

  try {
    const classId = "7fd46042-b33f-4fce-82e7-8c5c93e89067"; // CS 101
    const studentId = "142aa6f6-38f9-45de-8d07-74df1c273690"; // Jordan Lee

    const testNote = `Official Feedback Note created at ${new Date().toLocaleTimeString()} - Excellent progress on algorithm execution!`;

    console.log("⚙️ Inserting note into Supabase Postgres database...");
    const saved = await ClassModel.addStudentNote(classId, studentId, testNote);

    if (!saved) throw new Error("Failed to save note!");
    console.log("✅ Note inserted successfully into database!");

    // Re-query report from Supabase Postgres
    console.log("🔍 Fetching student report from Supabase Postgres...");
    const report = await ClassModel.getStudentReport(classId, studentId);

    console.log("📌 Saved Lecturer Notes in DB:", report?.savedNotes);

    if (!report?.savedNotes?.includes(testNote)) {
      throw new Error("Saved note not found in re-fetched student report!");
    }

    console.log("🎉 LECTURER FEEDBACK NOTES 100% PERSISTED & VERIFIED IN SUPABASE POSTGRES!");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  }
}

testFeedbackNotesPersistence();
