const { supabaseAdmin } = require("./supabase");

async function verifyDatabaseTables() {
  console.log("⚡ Checking Supabase Database connection & schema tables...");

  try {
    const { data: users, error: uErr } = await supabaseAdmin.from("users").select("id").limit(1);
    if (uErr) {
      console.warn("⚠️ Warning checking 'users' table:", uErr.message);
    } else {
      console.log("✅ Supabase 'users' table active.");
    }

    const { data: classes, error: cErr } = await supabaseAdmin.from("classes").select("id").limit(1);
    if (cErr) {
      console.warn("⚠️ Warning checking 'classes' table:", cErr.message);
    } else {
      console.log("✅ Supabase 'classes' table active.");
    }
  } catch (err) {
    console.error("❌ Database verification failed:", err.message);
  }
}

module.exports = { verifyDatabaseTables };
