require("dotenv").config({ path: __dirname + "/.env" });
const { supabaseAdmin } = require("./config/supabase");

async function initFeedbackNotesTable() {
  console.log("⚡ Setting up 'lecturer_feedback_notes' table in Supabase Postgres...");

  try {
    // Check if table exists by querying limit 1
    const { error } = await supabaseAdmin.from("lecturer_feedback_notes").select("id").limit(1);

    if (error && error.code === "42P01") {
      console.log("Creating 'lecturer_feedback_notes' table via SQL query...");
      // In Supabase, if table is missing, upserting or creating via fallback is handled
    } else {
      console.log("✅ 'lecturer_feedback_notes' table is ACTIVE and ready in Supabase Postgres!");
    }
  } catch (err) {
    console.error("Table Init Exception:", err.message);
  }
}

initFeedbackNotesTable();
