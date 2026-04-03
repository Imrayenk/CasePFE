import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export const createAuthSlice = (set, get) => ({
  user: null, 
  authLoading: true,
  
  signIn: async (email, password) => {
    if (IS_MOCK_MODE) return { success: false, error: 'Database connected, mock mode disabled.' };
    
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
            return { success: false, error: "DEVELOPER FIX: Go to Supabase Dashboard -> Authentication -> Providers -> Email -> Turn OFF 'Confirm Email'." };
        }
        return { success: false, error: error.message };
    }
    
    if (data?.user) {
       await get().fetchUserProfile(data.user);
    }
    
    return { success: true };
  },
  
  signInWithGoogle: async () => {
    if (IS_MOCK_MODE) return { success: false, error: 'Mock mode disabled.' };
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard'
        }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
  
  signUp: async (name, email, password, role) => {
    if (IS_MOCK_MODE) return { success: false, error: 'Mock mode disabled.' };
    const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } }
    });
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, role: role, full_name: name }
        ]);
        if (profileError) return { success: false, error: "Profile creation failed: " + profileError.message };
        get().fetchUsersDb();
        
        if (!data.session) {
            return { success: false, error: "DEVELOPER FIX: Go to Supabase Dashboard -> Authentication -> Providers -> Email -> Turn OFF 'Confirm Email'." };
        }
        
        return { success: true };
    }
    return { success: false, error: 'Unknown signup error.'};
  },
  
  signOut: async () => {
    if (!IS_MOCK_MODE) await supabase.auth.signOut();
    set({ user: null });
  },

  initializeSession: async () => {
    const stateTheme = get().isDarkMode;
    document.documentElement.classList.toggle('light', !stateTheme);
    document.documentElement.classList.toggle('dark', stateTheme !== false);

    if (IS_MOCK_MODE) {
      set({ authLoading: false });
      return;
    }

    // Try explicit token fetch precisely ONCE
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        await get().fetchUserProfile(session.user);
        get().fetchNotifications();
      } else {
        set({ user: null });
      }
    } catch (err) {
      console.error("Session initialize failed:", err);
      set({ user: null });
    } finally {
      // Free UI
      set({ authLoading: false });
    }

    // Single listener for explicit auth state changes (login/logout events), avoiding duplicates
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      
      if (session?.user && event === 'SIGNED_IN') {
        const currentUser = get().user;
        // Only fetch if missing or mismatched to stop race conditions
        if (!currentUser || currentUser.id !== session.user.id) {
            await get().fetchUserProfile(session.user);
            get().fetchNotifications();
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, notifications: [] });
      }
    });
  }
});
