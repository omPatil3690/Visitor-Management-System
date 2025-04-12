import { createClient } from "@supabase/supabase-js";

// ✅ Ensure environment variables exist
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase environment variables are missing.");
  throw new Error("⚠️ Missing Supabase URL or ANON KEY. Check your .env file and restart the server.");
}

// ✅ Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Debugging: Log environment variables (DO NOT expose keys in production)
console.log("🔍 Supabase URL:", supabaseUrl ? "✅ Loaded" : "❌ Missing");
console.log("🔍 Supabase Anon Key:", supabaseAnonKey ? "✅ Loaded" : "❌ Missing");

// ✅ Test Supabase connection
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
    } else {
      console.log("✅ Supabase connected successfully:", data);
    }
  } catch (err) {
    console.error("❌ Supabase initialization error:", err);
  }
})();
