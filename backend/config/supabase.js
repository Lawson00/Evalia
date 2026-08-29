const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "https://qboqrxfiakgqetioozdi.supabase.co";
const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || supabasePublishableKey;

// Public Supabase Client (Publishable Key)
const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Admin Supabase Client (Secret Key for privileged server operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

module.exports = {
  supabase,
  supabaseAdmin,
};
