import { create } from "zustand";
import { supabase } from "../lib/supabase.ts";
import type { Database } from "../lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface User {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // ✅ Initialize authentication
  initialize: async () => {
    console.log("🔄 Checking authentication...");
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ Supabase Auth Error:", error.message);
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      if (session?.user) {
        console.log("🔍 Supabase Session Found:", session);
        const { data: hostData, error: hostError } = await supabase
          .from("hosts")
          .select("*")
          .eq("auth_id", session.user.id)
          .single();

        if (hostError) throw hostError;

        // ❌ Block visitor role
        if (hostData.role === "visitor") {
          throw new Error("Visitor role is no longer supported");
        }

        set({
          user: hostData as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isAuthenticated: false, isLoading: false, user: null });
      }
    } catch (err: any) {
      console.error("❌ Authentication Initialization Failed:", err.message);
      set({
        isAuthenticated: false,
        isLoading: false,
        error: err.message || "Failed to initialize auth",
      });
    }
  },

  // ✅ Login function
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.user) {
        console.log("✅ User logged in:", data.user);
        const { data: hostData, error: hostError } = await supabase
          .from("hosts")
          .select("*")
          .eq("auth_id", data.user.id)
          .single();

        if (hostError) throw hostError;

        // ❌ Block visitor role
        if (hostData.role === "visitor") {
          throw new Error("Visitor role is no longer supported");
        }

        set({
          user: hostData as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error("❌ Login failed:", error.message);
      set({
        error: error.message || "Invalid credentials",
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  // ✅ Logout function
  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await supabase.auth.signOut();
      console.log("🚪 User logged out");
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error("❌ Logout failed:", error.message);
      set({ error: "Failed to logout", isLoading: false });
    }
  },
}));
