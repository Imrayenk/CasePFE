import { apiGet, apiPut } from '../../lib/api';

export const createProfileSlice = (set, get) => ({
  usersDb: [],
  avatars: {},
  updateAvatar: async (userId, base64Str) => {
      try {
          await apiPut(`/users/${userId}/avatar`, { avatar_url: base64Str });
      } catch (e) { console.error(e); }
      set(s => ({ avatars: { ...s.avatars, [userId]: base64Str }, user: s.user?.id === userId ? { ...s.user, avatar_url: base64Str } : s.user }));
  },
  fetchUserProfile: async () => {
      // Stubbed as sessions hydrate directly via /auth/me now in initializeSession
  },
  fetchUsersDb: async () => {
      try {
          const data = await apiGet('/users');
          const avatarsDict = {};
          data.forEach(p => {
              if(p.avatar_url) avatarsDict[p.id] = p.avatar_url;
          });

          set(s => ({ 
              usersDb: data,
              avatars: { ...s.avatars, ...avatarsDict }
          }));
      } catch (error) {
          console.error("fetchUsersDb error:", error);
      }
  },
  updateProfileName: async (newName) => {
     const state = get();
     if (!state.user) return;
     try {
        await apiPut(`/users/${state.user.id}/name`, { name: newName });
     } catch (e) { console.error("Profile update error", e); return; }
     set({ user: { ...state.user, name: newName } });
     get().fetchUsersDb();
  },
  updateUserRole: async (userId, newRole) => {
     try {
        await apiPut(`/users/${userId}/role`, { role: newRole });
     } catch (e) { console.error("Role update error", e); return; }
     get().fetchUsersDb();
  },
});
