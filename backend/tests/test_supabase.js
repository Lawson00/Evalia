require("dotenv").config({ path: __dirname + "/../.env" });
const { supabaseAdmin } = require("../config/supabase");

async function testSupabaseConnection() {
  console.log("⚡ Testing Supabase Database connection & schema tables...");

  try {
    const { data: users, error: uErr } = await supabaseAdmin.from("users").select("id, email, role").limit(2);
    if (uErr) throw uErr;
    console.log("✅ Supabase 'users' table active. Sample users:", users?.length);

    const { data: classes, error: cErr } = await supabaseAdmin.from("classes").select("id, name, join_code").limit(2);
    if (cErr) throw cErr;
    console.log("✅ Supabase 'classes' table active. Sample classes:", classes?.length);

    console.log("🎉 SUPABASE DATABASE CONNECTION TEST PASSED!");
  } catch (err) {
    console.error("❌ Supabase Connection Failed:", err.message);
  }
}

testSupabaseConnection();
