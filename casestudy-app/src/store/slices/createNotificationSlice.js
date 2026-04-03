import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export const createNotificationSlice = (set, get) => ({
  notifications: [],
  fetchNotifications: async () => {
     const state = get();
     if (IS_MOCK_MODE || !state.user) return;
     
     const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', state.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
        
     if (data && !error) {
         const mappedNotifications = data.map(n => ({
             id: n.id,
             userId: n.user_id,
             title: n.title,
             message: n.message,
             time: n.created_at,
             read: n.read
         }));
         set({ notifications: mappedNotifications });
     }
  },
  addNotification: async (title, message, targetUserId = null) => {
    const state = get();
    const userId = targetUserId || state.user?.id || 'system';
    
    if (IS_MOCK_MODE || userId === 'system') {
       set(s => ({
          notifications: [{ id: 'notif-' + Date.now(), userId, title, message, time: new Date().toISOString(), read: false }, ...s.notifications]
       }));
       return;
    }

    const { error } = await supabase.from('notifications').insert([{
        user_id: userId,
        title,
        message,
        read: false
    }]);
    
    if (error) {
        console.error("Error adding notification:", error);
    } else if (!targetUserId || targetUserId === state.user?.id) {
        get().fetchNotifications();
    }
  },
  markNotificationsAsRead: async () => {
    const state = get();
    const currentUserId = state.user?.id || 'system';
    if (IS_MOCK_MODE || currentUserId === 'system') {
        set(s => ({
           notifications: s.notifications.map(n => (n.userId === currentUserId && !n.read) ? { ...n, read: true } : n)
        }));
        return;
    }
    
    const { error } = await supabase.from('notifications')
        .update({ read: true })
        .eq('user_id', state.user.id)
        .eq('read', false);
        
    if (!error) {
        get().fetchNotifications();
    }
  },
  clearNotifications: async () => {
    const state = get();
    const currentUserId = state.user?.id || 'system';
    if (IS_MOCK_MODE || currentUserId === 'system') {
        set(s => ({
           notifications: s.notifications.filter(n => n.userId !== currentUserId)
        }));
        return;
    }

    const { error } = await supabase.from('notifications')
        .delete()
        .eq('user_id', state.user.id);
        
    if (!error) {
        get().fetchNotifications();
    }
  },
});
