import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';

export const createNotificationSlice = (set, get) => ({
  notifications: [],
  fetchNotifications: async () => {
     const state = get();
     if (!state.user) return;
     
     try {
         const data = await apiGet(`/notifications/${state.user.id}`);
         if (data) {
             const mappedNotifications = data.map(n => ({
                 id: n.id,
                 userId: n.userId,
                 title: n.title,
                 message: n.message,
                 time: n.createdAt,
                 read: n.read
             }));
             set({ notifications: mappedNotifications });
         }
     } catch (error) {
         console.error("fetchNotifications error:", error);
     }
  },
  addNotification: async (title, message, targetUserId = null) => {
    const state = get();
    const userId = targetUserId || state.user?.id || 'system';
    
    if (userId === 'system') {
       set(s => ({
          notifications: [{ id: 'notif-' + Date.now(), userId, title, message, time: new Date().toISOString(), read: false }, ...s.notifications]
       }));
       return;
    }

    try {
        await apiPost('/notifications', {
            userId,
            title,
            message
        });
        
        if (!targetUserId || targetUserId === state.user?.id) {
            get().fetchNotifications();
        }
    } catch (error) {
        console.error("Error adding notification:", error);
    }
  },
  markNotificationsAsRead: async () => {
    const state = get();
    const currentUserId = state.user?.id || 'system';
    if (currentUserId === 'system') {
        set(s => ({
           notifications: s.notifications.map(n => (n.userId === currentUserId && !n.read) ? { ...n, read: true } : n)
        }));
        return;
    }
    
    try {
        await apiPut(`/notifications/${state.user.id}/read`);
        get().fetchNotifications();
    } catch (error) {
        console.error("markNotificationsAsRead error:", error);
    }
  },
  clearNotifications: async () => {
    const state = get();
    const currentUserId = state.user?.id || 'system';
    if (currentUserId === 'system') {
        set(s => ({
           notifications: s.notifications.filter(n => n.userId !== currentUserId)
        }));
        return;
    }

    try {
        await apiDelete(`/notifications/${state.user.id}`);
        get().fetchNotifications();
    } catch (error) {
        console.error("clearNotifications error:", error);
    }
  },
});
