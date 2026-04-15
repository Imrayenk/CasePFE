import { IS_MOCK_MODE } from '../../lib/supabase';
import { apiGet, apiPost, apiDelete } from '../../lib/api';

export const createSocialSlice = (set, get) => ({
  socialData: {},
  fetchSocialData: async () => {
      if (IS_MOCK_MODE) return;
      
      try {
          const data = await apiGet('/cases/social/all');
          const newSocialData = {};
          
          data.likes?.forEach(like => {
              if(!newSocialData[like.caseId]) newSocialData[like.caseId] = { likes: [], comments: [] };
              if(!newSocialData[like.caseId].likes.includes(like.userId)) {
                  newSocialData[like.caseId].likes.push(like.userId);
              }
          });
          
          const avatarsDict = {};
          data.comments?.forEach(comment => {
              if(!newSocialData[comment.caseId]) newSocialData[comment.caseId] = { likes: [], comments: [] };
              
              if(comment.user?.avatar_url) avatarsDict[comment.userId] = comment.user.avatar_url;
              
              newSocialData[comment.caseId].comments.push({
                  id: comment.id,
                  userId: comment.userId,
                  userName: comment.user?.name || 'User',
                  text: comment.text,
                  time: comment.createdAt
              });
          });

          set(s => ({ 
              socialData: newSocialData,
              avatars: { ...s.avatars, ...avatarsDict }
          }));
      } catch (error) {
          console.error("fetchSocialData error:", error);
      }
  },
  toggleLike: async (caseId, userId) => {
      const state = get();
      const hasLiked = (state.socialData[caseId]?.likes || []).includes(userId);
      
      // Optimistic UI update
      set(s => {
          const fresh = s.socialData[caseId] || { likes: [], comments: [] };
          return {
              socialData: {
                  ...s.socialData,
                  [caseId]: {
                      ...fresh,
                      likes: hasLiked ? fresh.likes.filter(id => id !== userId) : [...fresh.likes, userId]
                  }
              }
          };
      });

      // Background sync
      if (!IS_MOCK_MODE) {
          try {
              await apiPost(`/cases/${caseId}/likes`, { userId });
          } catch (err) {
              console.error("Execution error during like sync:", err);
          }
      }
  },
  addComment: async (caseId, commentObj) => {
      let newComment = { ...commentObj, id: Date.now().toString(), time: new Date().toISOString() };
      
      set(s => {
          const fresh = s.socialData[caseId] || { likes: [], comments: [] };
          return {
              socialData: {
                  ...s.socialData,
                  [caseId]: {
                      ...fresh,
                      comments: [...fresh.comments, newComment]
                  }
              }
          };
      });

      if (!IS_MOCK_MODE) {
          try {
              const data = await apiPost(`/cases/${caseId}/comments`, { userId: commentObj.userId, text: commentObj.text });
              
              set(s => {
                  const caseSocial = s.socialData[caseId];
                  if (!caseSocial) return s;
                  return {
                      socialData: {
                          ...s.socialData,
                          [caseId]: {
                              ...caseSocial,
                              comments: caseSocial.comments.map(c => 
                                  c.id === newComment.id ? { ...c, id: data.id, time: data.createdAt } : c
                              )
                          }
                      }
                  };
              });
          } catch (error) {
              console.error("Comment insertion error:", error);
              set(s => {
                  const fresh = s.socialData[caseId] || { likes: [], comments: [] };
                  return {
                      socialData: {
                          ...s.socialData,
                          [caseId]: { ...fresh, comments: fresh.comments.filter(c => c.id !== newComment.id) }
                      }
                  };
              });
          }
      }
  },
  deleteComment: async (caseId, commentId) => {
      set(s => {
          const fresh = s.socialData[caseId] || { likes: [], comments: [] };
          return {
              socialData: {
                  ...s.socialData,
                  [caseId]: {
                      ...fresh,
                      comments: fresh.comments.filter(c => c.id !== commentId)
                  }
              }
          };
      });

      if (!IS_MOCK_MODE) {
          try {
              await apiDelete(`/cases/${caseId}/comments/${commentId}`);
          } catch (err) {
              console.error("Comment deletion error:", err);
          }
      }
  },
});
