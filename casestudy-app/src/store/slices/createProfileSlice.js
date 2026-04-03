import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export const createProfileSlice = (set, get) => ({
  usersDb: [],
  avatars: {},
  updateAvatar: async (userId, base64Str) => {
      if (!IS_MOCK_MODE) {
          await supabase.from('profiles').update({ avatar_url: base64Str }).eq('id', userId);
      }
      set(s => ({ avatars: { ...s.avatars, [userId]: base64Str } }));
  },
  fetchUserProfile: async (authUser) => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .limit(1);
      
    if (error) {
      console.error("Profile fetch error:", error);
    }
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      set(s => ({ 
          user: { id: profile.id, email: authUser.email, name: profile.full_name, role: profile.role },
          avatars: profile.avatar_url ? { ...s.avatars, [profile.id]: profile.avatar_url } : s.avatars
      }));
    } else {
      // Automatic profile creation for users signing in via OAuth (like Google)
      const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: authUser.id, full_name: name, role: 'learner' }]);
      
      if (!insertError) {
         set({ user: { id: authUser.id, email: authUser.email, name: name, role: 'learner' } });
         get().fetchUsersDb();
      } else {
         console.error("Profile creation error:", insertError);
         // Fallback if auth user exists but profile creation failed
         set({ user: { id: authUser.id, email: authUser.email, name: 'User', role: 'learner' } });
      }
    }
  },
  fetchUsersDb: async () => {
     const { data, error } = await supabase.rpc('get_users_with_emails');
     if (data && !error) {
         const mappedUsers = data.map(p => ({ id: p.id, name: p.full_name, role: p.role, email: p.email }));
         
         const avatarsDict = {};
         data.forEach(p => {
             if(p.avatar_url) avatarsDict[p.id] = p.avatar_url;
         });

         set(s => ({ 
             usersDb: mappedUsers,
             avatars: { ...s.avatars, ...avatarsDict }
         }));
     } else {
         const { data: fallbackData } = await supabase.from('profiles').select('id, full_name, role, avatar_url');
         if (fallbackData) {
             const avatarsDict = {};
             fallbackData.forEach(p => {
                 if(p.avatar_url) avatarsDict[p.id] = p.avatar_url;
             });
             set(s => ({ 
                 usersDb: fallbackData.map(p => ({ id: p.id, name: p.full_name, role: p.role, email: 'hidden@supabase.local' })),
                 avatars: { ...s.avatars, ...avatarsDict }
             }));
         }
     }
  },
  updateProfileName: async (newName) => {
     const state = get();
     if (!state.user) return;
     if (!IS_MOCK_MODE) {
         const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', state.user.id);
         if (error) { console.error("Profile update error", error); return; }
     }
     set({ user: { ...state.user, name: newName } });
     get().fetchUsersDb();
  },
  updateUserRole: async (userId, newRole) => {
     if (!IS_MOCK_MODE) {
         const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
         if (error) { console.error("Role update error", error); return; }
     }
     get().fetchUsersDb();
  },
});
