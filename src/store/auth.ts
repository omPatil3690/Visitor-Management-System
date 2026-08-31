import { create } from 'zustand';
import { api } from '../lib/api';

type UserRole = 'admin' | 'guard' | 'host';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
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

  // Initialize authentication
  initialize: async () => {
    console.log('🔄 Checking authentication...');
    try {
      const response = await api.getSession();

      if (response.error) {
        console.log('❌ Not authenticated:', response.error);
        set({ isAuthenticated: false, isLoading: false, user: null });
        return;
      }

      if (response.data?.user) {
        console.log('✅ Session found:', response.data.user);
        set({
          user: response.data.user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ isAuthenticated: false, isLoading: false, user: null });
      }
    } catch (err: any) {
      console.error('❌ Authentication initialization failed:', err.message);
      set({
        isAuthenticated: false,
        isLoading: false,
        error: err.message || 'Failed to initialize auth',
        user: null,
      });
    }
  },

  // Login function
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.login(email, password);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.user) {
        console.log('✅ User logged in:', response.data.user);
        set({
          user: response.data.user as User,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error.message);
      set({
        error: error.message || 'Invalid credentials',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  // Logout function
  logout: async () => {
    try {
      set({ isLoading: true, error: null });
      await api.logout();
      console.log('🚪 User logged out');
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message);
      set({ error: 'Failed to logout', isLoading: false });
    }
  },
}));
