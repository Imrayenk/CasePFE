import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase, IS_MOCK_MODE } from '../lib/supabase';

const initialCaseData = `
# Memorandum of Compliance Review

To: Executive Oversight Committee
From: Internal Compliance Division
Date: October 24, 2023

## 1. Executive Summary
The following document details the quarterly compliance audit for the fiscal year 2023. This review focuses on regulatory adherence within the international shipping department. Preliminary findings suggest a robust framework, though several minor discrepancies in documentation logs were noted during the mid-September peak.

## 2. Audit Methodology
Our team utilized a randomized sampling technique, analyzing over 4,500 individual transaction records spanning three jurisdictions. Each record was vetted against ISO 27001 standards and local regulatory requirements. The evaluation period covered June 1 through September 30.

## 3. Observations
During the audit, it was observed that the automated tracking system experienced a 4-hour downtime on August 12. During this period, manual ledger entries were utilized. While generally accurate, the level of detail in the manual logs does not fully meet the enhanced transparency requirements introduced in the Q1 policy update.

Furthermore, training sessions for new staff members were found to be 15% behind schedule, potentially leading to the operational bottlenecks observed in the Northern Region branch. It is recommended that these sessions are expedited before the holiday rush.
`;
const initialKeywords = [
  { id: 'k1', text: 'quarterly compliance audit for the fiscal year 2023', category: 'yellow' },
  { id: 'k2', text: 'minor discrepancies in documentation logs', category: 'blue' },
  { id: 'k3', text: 'ISO 27001 standards', category: 'yellow' },
  { id: 'k4', text: 'manual ledger entries', category: 'blue' },
  { id: 'k5', text: 'operational bottlenecks', category: 'yellow' }
];

const initialNodes = [
  { id: '1', type: 'problemNode', position: { x: 80, y: 180 }, data: { label: 'System Latency Spikes' } },
  { id: '2', type: 'causeNode', position: { x: 380, y: 120 }, data: { label: 'Database Indexing Overload' } },
  { id: '3', type: 'analysisNode', position: { x: 580, y: 280 }, data: { label: 'Cache-hit ratio dropped to 42% during peak hours.' } },
  { id: '4', type: 'solutionNode', position: { x: 780, y: 350 }, data: { label: 'Redis Implementation' } },
  { id: '5', type: 'conclusionNode', position: { x: 450, y: 480 }, data: { label: 'Predicted 30% increase in performance stability after rollout.'} }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e1-5', source: '1', target: '5' }
];

const useStore = create(
  persist(
    (set, get) => ({
      // User & Auth State
      user: null, // Start unauthenticated
      authLoading: true, // Initializing auth...
      usersDb: [],
      avatars: {},
      updateAvatar: async (userId, base64Str) => {
          if (!IS_MOCK_MODE) {
              await supabase.from('profiles').update({ avatar_url: base64Str }).eq('id', userId);
          }
          set(s => ({ avatars: { ...s.avatars, [userId]: base64Str } }));
      },
      socialData: {},
      fetchSocialData: async () => {
          if (IS_MOCK_MODE) return;
          // Generate a dynamic timestamp to physically bust aggressive browser level GET caching across all devices
          const cacheBuster = new Date(Date.now() - Math.floor(Math.random() * 10000)).toISOString();
          
          const [
              { data: likesData, error: likesError },
              { data: commentsData, error: commentsError }
          ] = await Promise.all([
              supabase.from('case_likes').select('*').gte('created_at', '2000-01-01T00:00:00Z').neq('created_at', cacheBuster),
              supabase.from('case_comments').select(`
                  id, case_id, user_id, text, created_at,
                  profiles ( full_name, avatar_url )
              `).gte('created_at', '2000-01-01T00:00:00Z').neq('created_at', cacheBuster)
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
                  
                  // Support array or object return format from Supabase joins
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
          
          // Optimistic UI update inside set to guarantee fresh state tracking
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

          // Background sync
          if (!IS_MOCK_MODE) {
              const { data, error } = await supabase.from('case_comments').insert([{
                  case_id: caseId,
                  user_id: commentObj.userId,
                  text: commentObj.text
              }]).select();
              
              if (error) {
                  console.error("Comment insertion error:", error);
                  // Rollback on failure
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
          // Optimistic UI update tracking fresh state
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

          // Background sync
          if (!IS_MOCK_MODE) {
              supabase.from('case_comments').delete().eq('id', commentId)
                  .then(({error}) => { if (error) console.error("Comment deletion error:", error); });
          }
      },
      isDarkMode: true,
      toggleDarkMode: () => set(s => {
          const newMode = !s.isDarkMode;
          document.documentElement.classList.toggle('light', !newMode);
          document.documentElement.classList.toggle('dark', newMode);
          return { isDarkMode: newMode };
      }),
      initAuth: () => {
        // Sync theme on load
        const stateTheme = get().isDarkMode;
        document.documentElement.classList.toggle('light', !stateTheme);
        document.documentElement.classList.toggle('dark', stateTheme !== false);

        if (IS_MOCK_MODE) {
          set({ authLoading: false });
          return;
        }

        // Force UI load immediately from purely local persisted state, bypassing all potential network hangs
        set({ authLoading: false }); 

        // Fetch initial session asynchronously without halting the UI, preventing 5s timeouts
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            get().fetchUserProfile(session.user).catch((err) => console.error("Profile fallback fetch failed:", err));
            get().fetchNotifications();
            get().fetchUsersDb();
            get().fetchSocialData();
          }
        }).catch((err) => {
          console.error("Session fetch failed:", err);
          set({ authLoading: false }); // Unblock UI on error
        });

        // Listen for active login/logout triggers
        supabase.auth.onAuthStateChange(async (event, session) => {
          // Ignore INITIAL_SESSION to prevent duplicate fetch requests that choke the network queue
          if (event === 'INITIAL_SESSION') return;
          
          if (session?.user && event === 'SIGNED_IN') {
            await get().fetchUserProfile(session.user);
            get().fetchNotifications();
            get().fetchUsersDb();
            get().fetchSocialData();
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, notifications: [] });
          }
        });
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
             
             // Extract avatars into dictionary
             const avatarsDict = {};
             data.forEach(p => {
                 if(p.avatar_url) avatarsDict[p.id] = p.avatar_url;
             });

             set(s => ({ 
                 usersDb: mappedUsers,
                 avatars: { ...s.avatars, ...avatarsDict }
             }));
         } else {
             // Fallback to regular profile fetch if RPC is not deployed yet
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
      signIn: async (email, password) => {
        if (IS_MOCK_MODE) return { success: false, error: 'Database connected, mock mode disabled.' };
        
        let { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        // Seamless fallback: If user doesn't exist, automatically sign them up!
        if (error && error.message.toLowerCase().includes('credential')) {
            const signUpResponse = await supabase.auth.signUp({
                email, password, options: { data: { full_name: email.split('@')[0] } }
            });
            
            if (signUpResponse.data?.user && !signUpResponse.error) {
                // Pre-provision their default learner profile
                await supabase.from('profiles').insert([
                    { id: signUpResponse.data.user.id, role: 'learner', full_name: email.split('@')[0] }
                ]);
                get().fetchUsersDb();
                
                // If Supabase requires email confirmation, the session will be null!
                if (!signUpResponse.data.session) {
                    return { success: false, error: "Please disable 'Confirm Email' in your Supabase Auth settings, or check your inbox to confirm!" };
                }
                
                // Proceed with the new auth session
                data = signUpResponse.data;
                error = null;
            } else {
                return { success: false, error: signUpResponse.error?.message || error.message };
            }
        } else if (error) {
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

      // Notifications State
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

      // Case State
      cases: [],
      fetchCases: async () => {
         if (IS_MOCK_MODE) return;
         
         const cacheBuster = new Date(Date.now() - Math.floor(Math.random() * 10000)).toISOString();
         const { data, error } = await supabase.from('cases').select('*')
              .gte('created_at', '2000-01-01T00:00:00Z').neq('created_at', cacheBuster)
              .order('created_at', { ascending: false });
              
         if (data && !error) {
             const mappedCases = data.map(c => ({
                 id: c.id,
                 title: c.title,
                 content: c.content,
                 description: c.description || '',
                 date: new Date(c.created_at).toISOString().split('T')[0],
                 status: c.status === 'draft' ? 'Draft' : (c.status === 'active' ? 'Active' : 'Closed'),
                 attachments: c.attachments || [],
                 updateHistory: c.update_history || []
             }));
             set({ cases: mappedCases });
             
             // Globally resync social data whenever cases are reloaded from the Dashboard
             get().fetchSocialData();
         }
      },
      addCase: async (newCase) => {
          if (IS_MOCK_MODE) return true;
          const statusMap = { 'Active': 'active', 'Closed': 'closed', 'Draft': 'draft' };
          const { error } = await supabase.from('cases').insert([{
              title: newCase.title,
              content: newCase.content,
              description: newCase.description,
              status: statusMap[newCase.status] || 'draft',
              attachments: newCase.attachments || [],
              update_history: newCase.updateHistory || [],
              teacher_id: get().user?.id
          }]);
          if (!error) {
              await get().fetchCases();
              return true;
          } else {
              console.error("Error adding case:", error);
              return { error: error.message || "Failed to add case due to a database error." };
          }
      },
      updateCase: async (updatedCase) => {
          if (IS_MOCK_MODE) return true;
          const statusMap = { 'Active': 'active', 'Closed': 'closed', 'Draft': 'draft' };
          const { error } = await supabase.from('cases').update({
              title: updatedCase.title,
              content: updatedCase.content,
              description: updatedCase.description,
              status: statusMap[updatedCase.status] || 'draft',
              attachments: updatedCase.attachments || [],
              update_history: updatedCase.updateHistory || []
          }).eq('id', updatedCase.id);
          if (!error) {
              await get().fetchCases();
              return true;
          } else {
              console.error("Error updating case:", error);
              return { error: error.message || "Failed to update case due to a database error." };
          }
      },
      deleteCase: async (id) => {
          if (IS_MOCK_MODE) return;
          const { error } = await supabase.from('cases').delete().eq('id', id);
          if (!error) get().fetchCases();
          else console.error("Error deleting case:", error);
      },
      currentCase: null,
      caseWorkspaces: {},
      setCurrentCase: (id) => set(state => { 
        if (state.currentCase?.id === id) return {}; 
        
        const newCaseWorkspaces = { ...state.caseWorkspaces };
        if (state.currentCase) {
           newCaseWorkspaces[state.currentCase.id] = {
              keywords: state.keywords,
              summaryText: state.summaryText,
              nodes: state.nodes,
              edges: state.edges
           };
        }

        const targetCaseWorkspace = newCaseWorkspaces[id] || (id === '8429-CR' ? {
           keywords: [...initialKeywords],
           summaryText: '',
           nodes: [...initialNodes],
           edges: [...initialEdges]
        } : {
           keywords: [],
           summaryText: '',
           nodes: [],
           edges: []
        });

        return { 
           currentCase: state.cases.find(c => c.id === id) || null,
           caseWorkspaces: newCaseWorkspaces,
           keywords: targetCaseWorkspace.keywords,
           summaryText: targetCaseWorkspace.summaryText,
           nodes: targetCaseWorkspace.nodes,
           edges: targetCaseWorkspace.edges
        };
      }),
      
      // Workspace State (Keyword Extractor + Summary)
      keywords: [...initialKeywords],
      summaryText: '',
      setSummaryText: (text) => set({ summaryText: text }),
      appendSummaryText: (text) => set(state => ({ summaryText: state.summaryText + `<p>${text}</p>` })),
      isGeneratingDraft: false,
      generateDraft: async () => {
        const state = get();
        const developerApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        
        if (!developerApiKey) {
           set({ summaryText: '<p><em><strong>Configuration Error:</strong> The developer has not provided a Gemini API Key in the <code>.env</code> file. Please ask the administrator to configure <code>VITE_GEMINI_API_KEY</code>.</em></p>' });
           return;
        }

        if (state.keywords.length === 0 && state.nodes.length === 0) {
            set({ summaryText: '<p><em>Please extract some keywords from the case study or build a Concept Map first so I can generate a tailored draft.</em></p>' });
            return;
        }

        set({ isGeneratingDraft: true, summaryText: '<p><em>Synthesizing your workspace data using Gemini AI...</em></p>' });
        
        try {
            const genAI = new GoogleGenerativeAI(developerApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let prompt = `You are a professional assistant helping a student write a compliance review summary.
Based on the following Case Study text, and the structural logical points the student has identified, write a cohesive, professional 2-3 paragraph summary.
Your output MUST be entirely valid HTML inside <p> and <ul>/<li> tags as it will be injected into a rich text editor. Do NOT use markdown code blocks (\`\`\`).

--- CASE STUDY CONTEXT ---
${state.currentCase?.content || state.currentCase?.description || 'No case content provided.'}

--- STUDENT'S EXTRACTED KEYWORDS ---
${state.keywords.map(k => k.text).join(', ')}

--- STUDENT'S LOGICAL CONCEPT MAP (Use this to structure the narrative) ---
`;
            
            const problems = state.nodes.filter(n => n.type === 'problemNode');
            if (problems.length > 0) prompt += `Identified Problem(s): ${problems.map(n => n.data.label).join('; ')}\n`;

            const causes = state.nodes.filter(n => n.type === 'causeNode');
            if (causes.length > 0) prompt += `Root Cause(s): ${causes.map(n => n.data.label).join('; ')}\n`;

            const analyses = state.nodes.filter(n => n.type === 'analysisNode');
            if (analyses.length > 0) prompt += `Analysis: ${analyses.map(n => n.data.label).join('; ')}\n`;

            const evidence = state.nodes.filter(n => n.type === 'evidenceNode');
            if (evidence.length > 0) prompt += `Supporting Evidence: ${evidence.map(n => n.data.label).join('; ')}\n`;

            const solutions = state.nodes.filter(n => n.type === 'solutionNode');
            if (solutions.length > 0) prompt += `Proposed Solution(s): ${solutions.map(n => n.data.label).join('; ')}\n`;

            const conclusions = state.nodes.filter(n => n.type === 'conclusionNode');
            if (conclusions.length > 0) prompt += `Conclusion: ${conclusions.map(n => n.data.label).join('; ')}\n`;

            const notes = state.nodes.filter(n => n.type === 'noteNode');
            if (notes.length > 0) prompt += `Additional Notes: ${notes.map(n => n.data.label).join('; ')}\n`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            // Clean up any potential markdown formatting the AI might still include
            const cleanedHtml = responseText.replace(/```html|```/g, '').trim();
            
            set({ summaryText: cleanedHtml, isGeneratingDraft: false });
        } catch (error) {
            console.error("Gemini Generation Error:", error);
            set({ summaryText: `<p><em>Error generating draft: ${error.message}. Please check the API configuration and try again.</em></p>`, isGeneratingDraft: false });
        }
      },
      isExtractingConcepts: false,
      extractConceptsAI: async () => {
        const state = get();
        const developerApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        
        if (!developerApiKey) {
           set({ summaryText: '<p><em><strong>Configuration Error:</strong> The developer has not provided a Gemini API Key in the <code>.env</code> file. Please ask the administrator to configure <code>VITE_GEMINI_API_KEY</code>.</em></p>' });
           return;
        }

        const caseContent = state.currentCase?.content || state.currentCase?.description || '';
        if (!caseContent) return;

        set({ isExtractingConcepts: true });
        
        try {
            const genAI = new GoogleGenerativeAI(developerApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

            const prompt = `You are an expert business analyst helping a student extract key concepts from a case study.
Read the following case study text.
Extract exactly 3 to 5 key phrases or concepts.
For each concept, assign a category: 'yellow' for general notes, problems, or observations, and 'blue' for specific evidence, dates, facts, or data points.
Return the result STRICTLY as a JSON array of objects. Example format: [{"text": "operational bottlenecks", "category": "yellow"}, {"text": "15% behind schedule", "category": "blue"}]

--- CASE STUDY CONTEXT ---
${caseContent}
`;
            
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            const extracted = JSON.parse(responseText.trim());
            
            if (Array.isArray(extracted)) {
                const newKeywords = extracted.map((kw, i) => ({
                    id: 'ai-k' + Date.now() + '-' + i,
                    text: kw.text,
                    category: kw.category === 'blue' ? 'blue' : 'yellow'
                }));
                set(state => ({ keywords: [...state.keywords, ...newKeywords], isExtractingConcepts: false }));
            } else {
                set({ isExtractingConcepts: false });
            }
        } catch (error) {
            console.error("Gemini Extraction Error:", error);
            set({ summaryText: `<p><em>Error extracting concepts: ${error.message}. Check console for details.</em></p>`, isExtractingConcepts: false });
        }
      },
      addKeyword: (text, category) => set((state) => ({ 
        keywords: [...state.keywords, { id: 'k' + Date.now(), text, category }]
      })),
      removeKeyword: (id) => set((state) => ({
        keywords: state.keywords.filter(k => k.id !== id)
      })),

      // Teacher State (Mock Submissions)
      submissions: [],
      fetchSubmissions: async () => {
         const state = get();
         if (IS_MOCK_MODE || !state.user) return;
         
         let query = supabase
            .from('submissions')
            .select(`*, profiles(full_name)`)
            .order('created_at', { ascending: false });
            
         // If learner, only fetch their own submissions
         if (state.user.role === 'learner') {
             query = query.eq('learner_id', state.user.id);
         }

         const { data, error } = await query;
         if (data && !error) {
             const mappedSubmissions = data.map(s => ({
                 id: s.id,
                 learnerName: s.profiles?.full_name || 'Unknown Learner',
                 caseId: s.case_id,
                 status: s.status === 'in_progress' ? 'In Progress' : (s.status === 'submitted' ? 'Submitted' : (s.status === 'graded' ? 'Graded' : 'Graded (Override)')),
                 score: s.final_grade || 0,
                 date: new Date(s.created_at).toISOString().split('T')[0],
                 wordCount: s.word_count || 0,
                 keywords: s.keyword_count || 0,
                 nodes: s.node_count || 0,
                 hasConclusion: s.has_conclusion || false,
                 overrideHistory: s.override_history || []
             }));
             set({ submissions: mappedSubmissions });
         }
      },
      updateSubmissionScore: async (id, newScore) => {
         if (IS_MOCK_MODE) return { success: true };
         const state = get();
         const sub = state.submissions.find(s => s.id === id);
         const oldScore = sub ? sub.score : 0;
         const history = sub ? [...(sub.overrideHistory || [])] : [];
         
         const newEntry = {
             timestamp: new Date().toISOString(),
             oldScore: oldScore,
             newScore: newScore,
             teacherName: state.user?.name || 'Instructor'
         };
         history.push(newEntry);

         const { error } = await supabase.from('submissions')
            .update({ final_grade: newScore, status: 'graded_override', override_history: history })
            .eq('id', id);
            
         if (error) {
             console.error("Score update RLS/DB error:", error);
             return { success: false, error: error.message };
         }
         await get().fetchSubmissions();
         return { success: true };
      },

      // Concept Mapper State
      nodes: [...initialNodes],
      edges: [...initialEdges],
      setNodes: (nodes) => set({ nodes: typeof nodes === 'function' ? nodes(get().nodes) : nodes }),
      setEdges: (edges) => set({ edges: typeof edges === 'function' ? edges(get().edges) : edges }),
      updateNodeLabel: (nodeId, newLabel) => set((state) => ({
        nodes: state.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n)
      })),
      deleteNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter(n => n.id !== nodeId),
        edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      })),
      onNodesChange: (changes) => {
        // Since we import from @xyflow/react later, we'll apply them in the component itself
        // but we can also store the direct arrays here
      },

      // Evaluation / Submission state
      evaluationReady: 85,
      submissionResult: null,
      saveDraft: async (currentWordCount, silent = true) => {
         const state = get();
         if (IS_MOCK_MODE || !state.currentCase?.id || !state.user?.id) return;

         let wordCount = currentWordCount;
         if (wordCount === undefined) {
             const spacedHtml = state.summaryText
                .replace(/<p>|<br\s*\/?>|<li>|<ol>|<ul>|<div>|<h1>|<h2>|<h3>/gi, ' ')
                .replace(/<\/p>|<\/li>|<\/ol>|<\/ul>|<\/div>|<\/h1>|<\/h2>|<\/h3>/gi, ' ')
                .replace(/<[^>]*>/g, '') 
                .replace(/&nbsp;/ig, ' ')
                .replace(/&[a-z]+;/ig, ' '); 
             const plainText = spacedHtml.replace(/\s+/g, ' ').trim();
             wordCount = plainText === '' ? 0 : plainText.split(/\s+/).length;
         }

         const { error } = await supabase.from('submissions').upsert([{
             case_id: state.currentCase.id,
             learner_id: state.user.id,
             summary_text: state.summaryText,
             draft_keywords: state.keywords,
             draft_nodes: state.nodes,
             draft_edges: state.edges,
             status: 'in_progress',
             word_count: wordCount,
             updated_at: new Date().toISOString()
         }], { onConflict: 'case_id,learner_id' });

         if (error) {
             console.error("Error saving draft:", error);
         } else if (!silent) {
             state.addNotification('Draft Saved', `Your progress on ${state.currentCase.title} has been backed up.`);
         }
      },
      fetchDraft: async (caseId) => {
         const state = get();
         if (IS_MOCK_MODE || !state.user?.id || !caseId) return;
         
         const { data, error } = await supabase
            .from('submissions')
            .select('summary_text, draft_keywords, draft_nodes, draft_edges')
            .eq('case_id', caseId)
            .eq('learner_id', state.user.id)
            .eq('status', 'in_progress')
            .maybeSingle();
            
         if (!error && data) {
             if (data.summary_text) set({ summaryText: data.summary_text });
             if (data.draft_keywords) set({ keywords: data.draft_keywords });
             if (data.draft_nodes) set({ nodes: data.draft_nodes });
             if (data.draft_edges) set({ edges: data.draft_edges });
         }
      },
      submitAssignment: async () => {
        try {
          const state = get();
          console.log("Starting submission for case:", state.currentCase?.id);
          
          const spacedHtml = state.summaryText
              .replace(/<p>|<br\s*\/?>|<li>|<ol>|<ul>|<div>|<h1>|<h2>|<h3>/gi, ' ')
              .replace(/<\/p>|<\/li>|<\/ol>|<\/ul>|<\/div>|<\/h1>|<\/h2>|<\/h3>/gi, ' ')
              .replace(/<[^>]*>/g, '') 
              .replace(/&nbsp;/ig, ' ')
              .replace(/&[a-z]+;/ig, ' '); 
              
          const plainText = spacedHtml.replace(/\s+/g, ' ').trim();
          const wordCount = plainText === '' ? 0 : plainText.split(/\s+/).length;
          const keywordCount = state.keywords.length;
          const nodeCount = state.nodes.length;
          const hasConclusion = state.nodes.some(n => n.type === 'conclusionNode');

          if (IS_MOCK_MODE) return { score: 85, wordCount, keywordCount, nodeCount, hasConclusion };

          if (!state.user?.id || !state.currentCase?.id) {
            console.error("Missing user or case ID", { user: state.user?.id, case: state.currentCase?.id });
            throw new Error("Missing user or case information. Please try refreshing.");
          }

          // 1. Insert Core Submission Data
          const { data: subData, error: subError } = await supabase.from('submissions').upsert([{
              case_id: state.currentCase.id,
              learner_id: state.user.id,
              summary_text: state.summaryText,
              draft_keywords: state.keywords,
              draft_nodes: state.nodes,
              draft_edges: state.edges,
              status: 'submitted',
              word_count: wordCount,
              keyword_count: keywordCount,
              node_count: nodeCount,
              has_conclusion: hasConclusion,
              updated_at: new Date().toISOString()
          }], { onConflict: 'case_id,learner_id' }).select().single();

          if (subError) {
              console.error("Submission DB Error:", subError);
              throw new Error(`Database error: ${subError.message}`);
          }

          if (!subData) {
            console.error("No data returned from submission upsert");
            throw new Error("Failed to save submission metadata.");
          }

          const submissionId = subData.id;
          console.log("Submission saved, ID:", submissionId);

          // Clean out existing keywords/nodes first to prevent duplicates on overwrite
          await supabase.from('keywords').delete().eq('submission_id', submissionId);
          await supabase.from('concept_nodes').delete().eq('submission_id', submissionId);

          // 2. Insert Extracted Keywords
          if (state.keywords.length > 0) {
              const kws = state.keywords.map(k => ({
                  submission_id: submissionId,
                  term: k.text,
                  category: k.category
              }));
              const { error: kwError } = await supabase.from('keywords').insert(kws);
              if (kwError) console.error("Keyword Insert Error:", kwError);
          }

          // 3. Insert Concept Nodes
          if (state.nodes.length > 0) {
              const nodesToInsert = state.nodes.map(n => {
                  let nodeType = n.type.replace('Node', '').toLowerCase();
                  if (!['problem', 'cause', 'analysis', 'solution', 'conclusion', 'note', 'evidence'].includes(nodeType)) {
                     nodeType = 'note';
                  }
                  return {
                      submission_id: submissionId,
                      node_type: nodeType,
                      text_content: n.data.label,
                      position_x: n.position.x,
                      position_y: n.position.y
                  };
              });
              const { error: nodeError } = await supabase.from('concept_nodes').insert(nodesToInsert);
              if (nodeError) console.error("Node Insert Error:", nodeError);
          }

          // 4. Trigger RPC Logic Grading
          console.log("Triggering evaluation RPC...");
          const { data: evalResult, error: evalError } = await supabase.rpc('evaluate_submission', { p_submission_id: submissionId });
          
          if (evalError) {
            console.error("Evaluation RPC Error:", evalError);
            // Don't throw here, we might still have partial results or can show a fallback
          }

          get().fetchSubmissions();

          const score = evalResult?.score || 0;
          state.addNotification('Case Submitted', `You scored ${score}/100 on ${state.currentCase?.title || 'Case Study'}`);
          
          // Notify all teachers about the new submission
          const learnerName = state.user?.name || 'Anonymous Learner';
          const caseTitle = state.currentCase?.title || 'Case Study';
          state.usersDb.filter(u => u.role === 'teacher').forEach(teacher => {
            state.addNotification('New Submission', `${learnerName} submitted ${caseTitle} with a score of ${score}/100.`, teacher.id);
          });
          
          const fullResult = { ...evalResult, wordCount, keywordCount, nodeCount, hasConclusion };
          set({ submissionResult: fullResult });
          console.log("Submission process complete.");
          return fullResult;
        } catch (error) {
          console.error("Complete submission catch:", error);
          throw error;
        }
      }
    }),
    {
      name: 'casestudy-storage',
      partialize: (state) => ({ 
        summaryText: state.summaryText, 
        nodes: state.nodes, 
        edges: state.edges,
        keywords: state.keywords,
        caseWorkspaces: state.caseWorkspaces,
        submissions: state.submissions,
        user: state.user,
        usersDb: state.usersDb,
        cases: state.cases,
        isDarkMode: state.isDarkMode,
        avatars: state.avatars,
        socialData: state.socialData
      }),
    }
  )
);

export default useStore;
