import { IS_MOCK_MODE } from '../../lib/supabase';
import { apiGet, apiPost } from '../../lib/api';

export const createAuthSlice = (set, get) => ({
  user: null, 
  authLoading: true,
  
  signIn: async (email, password) => {
    if (IS_MOCK_MODE) return { success: false, error: 'Database connected, mock mode disabled.' };
    
    try {
        const data = await apiPost('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ user: data.user });
        get().fetchNotifications?.();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
  },
  
  signInWithGoogle: async () => {
    return { success: false, error: 'Google sign-in is temporarily unavailable in local mode' };
  },
  
  signUp: async (name, email, password, role) => {
    if (IS_MOCK_MODE) return { success: false, error: 'Mock mode disabled.' };
    
    try {
        const data = await apiPost('/auth/register', { name, email, password, role });
        localStorage.setItem('token', data.token);
        set({ user: data.user });
        get().fetchNotifications?.();
        get().fetchUsersDb?.();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message || 'Unknown signup error.' };
    }
  },
  
  signOut: async () => {
    localStorage.removeItem('token');
    set({ user: null, notifications: [] });
  },

  initializeSession: async () => {
    const stateTheme = get().isDarkMode;
    document.documentElement.classList.toggle('light', !stateTheme);
    document.documentElement.classList.toggle('dark', stateTheme !== false);

    if (IS_MOCK_MODE) {
      set({ authLoading: false });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        set({ user: null, authLoading: false });
        return;
    }

    try {
        const data = await apiGet('/auth/me');
        if (data && data.user) {
            set({ user: data.user });
            get().fetchNotifications?.();
        } else {
            throw new Error("Invalid session");
        }
    } catch (err) {
        console.error("Session initialize failed:", err);
        localStorage.removeItem('token');
        set({ user: null });
    } finally {
        set({ authLoading: false });
    }
  }
});
