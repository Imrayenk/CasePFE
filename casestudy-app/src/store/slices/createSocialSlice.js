import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export const createSocialSlice = (set, get) => ({
  socialData: {},
  fetchSocialData: async () => {
      if (IS_MOCK_MODE) return;
      
      const [
          { data: likesData, error: likesError },
          { data: commentsData, error: commentsError }
      ] = await Promise.all([
          supabase.from('case_likes').select('*').gte('created_at', '2000-01-01T00:00:00Z'),
          supabase.from('case_comments').select(`
              id, case_id, user_id, text, created_at,
              profiles ( full_name, avatar_url )
          `).gte('created_at', '2000-01-01T00:00:00Z')
      ]);

      if (likesError) console.error("Error fetching likes:", likesError.message || likesError);
      if (commentsError) console.error("Error fetching comments:", commentsError.message || commentsError);

      if (!likesError && !commentsError) {
          const newSocialData = {};
          likesData?.forEach(like => {
              if(!newSocialData[like.case_id]) newSocialData[like.case_id] = { likes: [], comments: [] };
              // Prevent duplicate likes
              if(!newSocialData[like.case_id].likes.includes(like.user_id)) {
                  newSocialData[like.case_id].likes.push(like.user_id);
              }
          });
          
          const avatarsDict = {};
          commentsData?.forEach(comment => {
              if(!newSocialData[comment.case_id]) newSocialData[comment.case_id] = { likes: [], comments: [] };
              
              const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              if(profile?.avatar_url) avatarsDict[comment.user_id] = profile.avatar_url;
              
              newSocialData[comment.case_id].comments.push({
                  id: comment.id,
                  userId: comment.user_id,
                  userName: profile?.full_name || 'User',
                  text: comment.text,
                  time: comment.created_at
              });
          });

          set(s => ({ 
              socialData: newSocialData,
              avatars: { ...s.avatars, ...avatarsDict }
          }));
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
              if (hasLiked) {
                  const { error } = await supabase.from('case_likes').delete().eq('case_id', caseId).eq('user_id', userId).select();
                  if (error) console.error("Like deletion error:", error);
              } else {
                  const { error } = await supabase.from('case_likes').upsert(
                      { case_id: caseId, user_id: userId }, 
                      { onConflict: 'case_id,user_id', ignoreDuplicates: true }
                  ).select();
                  if (error) console.error("Like insertion error:", error);
              }
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
          const { data, error } = await supabase.from('case_comments').insert([{
              case_id: caseId,
              user_id: commentObj.userId,
              text: commentObj.text
          }]).select();
          
          if (error) {
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
              return;
          }
          
          if (data && data.length > 0) {
              set(s => {
                  const caseSocial = s.socialData[caseId];
                  if (!caseSocial) return s;
                  return {
                      socialData: {
                          ...s.socialData,
                          [caseId]: {
                              ...caseSocial,
                              comments: caseSocial.comments.map(c => 
                                  c.id === newComment.id ? { ...c, id: data[0].id, time: data[0].created_at } : c
                              )
                          }
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
          supabase.from('case_comments').delete().eq('id', commentId)
              .then(({error}) => { if (error) console.error("Comment deletion error:", error); });
      }
  },
});
