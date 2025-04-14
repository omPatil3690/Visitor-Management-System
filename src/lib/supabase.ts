import { createClient } from "@supabase/supabase-js";

// ✅ Ensure environment variables exist
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase environment variables are missing.");
  throw new Error("⚠️ Missing Supabase URL or ANON KEY. Check your .env file and restart the server.");
}

// ✅ Create Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
  db: {
    schema: 'public',
  },
});

// ✅ Debugging: Log environment variables (DO NOT expose keys in production)
console.log("🔍 Supabase URL:", supabaseUrl ? "✅ Loaded" : "❌ Missing");
console.log("🔍 Supabase Anon Key:", supabaseAnonKey ? "✅ Loaded (truncated for security)" : "❌ Missing");

// ✅ Enhanced connection test with error handling
(async () => {
  try {
    // Test both auth and data access
    const [sessionCheck, dataCheck] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('visits').select('*', { count: 'exact', head: true })
    ]);

    if (sessionCheck.error) {
      console.error("❌ Auth connection failed:", sessionCheck.error.message);
    } else {
      console.log("✅ Auth session:", sessionCheck.data.session ? "Active" : "No active session");
    }

    if (dataCheck.error) {
      console.error("❌ Data access failed:", dataCheck.error.message);
      console.log("⚠️ Check your RLS policies and table permissions");
    } else {
      console.log(`✅ Data access successful (${dataCheck.count} visits exist)`);
    }

    // Additional debug for realtime
    const channel = supabase.channel('test-connection')
      .on('broadcast', { event: 'test' }, () => {})
      .subscribe((status) => {
        console.log(`🔄 Realtime status: ${status}`);
      });

    setTimeout(() => {
      channel.unsubscribe();
    }, 1000);

  } catch (err) {
    console.error("❌ Supabase initialization error:", err);
    if (err instanceof Error) {
      console.error("Stack trace:", err.stack);
    }
  }
})();