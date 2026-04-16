import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';

const parseJsonValue = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export const createCaseSlice = (set, get) => ({
  cases: [],
  fetchCases: async () => {
     try {
         const data = await apiGet('/cases');
         const mappedCases = data.map(c => {
             const parsedAttachments = parseJsonValue(c.attachments, []);
             const parsedHistory = parseJsonValue(c.update_history, []);

             return {
                 id: c.id,
                 title: c.title,
                 content: c.content,
                 description: c.description || '',
                 date: new Date(c.createdAt).toISOString().split('T')[0],
                 status: c.status === 'draft' ? 'Draft' : (c.status === 'active' ? 'Active' : 'Closed'),
                 attachments: parsedAttachments,
                 updateHistory: parsedHistory
             };
         });
         set({ cases: mappedCases });
     } catch (error) {
         console.error("Error fetching cases:", error);
     }
  },
  addCase: async (newCase) => {
      const statusMap = { 'Active': 'active', 'Closed': 'closed', 'Draft': 'draft' };
      
      try {
          await apiPost('/cases', {
              title: newCase.title,
              content: newCase.content,
              description: newCase.description,
              status: statusMap[newCase.status] || 'draft',
              attachments: newCase.attachments || [],
              update_history: newCase.updateHistory || [],
              teacherId: get().user?.id
          });
          await get().fetchCases();
          return true;
      } catch (error) {
          console.error("Error adding case:", error);
          return { error: error.message || "Failed to add case due to a database error." };
      }
  },
  updateCase: async (updatedCase) => {
      const statusMap = { 'Active': 'active', 'Closed': 'closed', 'Draft': 'draft' };
      
      try {
          await apiPut(`/cases/${updatedCase.id}`, {
              title: updatedCase.title,
              content: updatedCase.content,
              description: updatedCase.description,
              status: statusMap[updatedCase.status] || 'draft',
              attachments: updatedCase.attachments || [],
              update_history: updatedCase.updateHistory || []
          });
          await get().fetchCases();
          return true;
      } catch (error) {
          console.error("Error updating case:", error);
          return { error: error.message || "Failed to update case due to a database error." };
      }
  },
  deleteCase: async (id) => {
      try {
          // Optimistically remove from state for snappy UX
          const previousCases = get().cases;
          set({ cases: previousCases.filter(c => c.id !== id) });
          
          await apiDelete(`/cases/${id}`);
          get().fetchCases();
          get().fetchSocialData?.();
          return { success: true };
      } catch (error) {
          console.error("Error deleting case:", error);
          get().fetchCases(); // Restore on failure
          return { success: false, error: error.message || "Failed to delete case." };
      }
  },
  
  currentCase: null,
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

  submissions: [],
  fetchSubmissions: async () => {
     const state = get();
     if (!state.user) return;
     
     try {
         const queryParams = state.user.role === 'learner' ? `?learnerId=${state.user.id}` : '';
         const data = await apiGet(`/submissions${queryParams}`);
         if (data) {
             const mappedSubmissions = data.map(s => {
                 const parsedHistory = parseJsonValue(s.override_history, []);
                 return {
                     id: s.id,
                     learnerName: s.learner?.name || 'Unknown Learner',
                     caseId: s.caseId,
                     status: s.status === 'in_progress' ? 'In Progress' : (s.status === 'submitted' ? 'Submitted' : (s.status === 'graded' ? 'Graded' : 'Graded (Override)')),
                     score: s.final_grade || 0,
                     date: new Date(s.createdAt).toISOString().split('T')[0],
                     wordCount: s.word_count || 0,
                     keywords: s.keyword_count || 0,
                     nodes: s.node_count || 0,
                     hasConclusion: s.has_conclusion || false,
                     overrideHistory: parsedHistory
                 };
             });
             set({ submissions: mappedSubmissions });
         }
     } catch (error) {
         console.error("fetchSubmissions error:", error);
     }
  },
  updateSubmissionScore: async (id, newScore) => {
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

     try {
         await apiPut(`/submissions/${id}/score`, { newScore, history });
         await get().fetchSubmissions();
         return { success: true };
     } catch (error) {
         console.error("Score update error:", error);
         return { success: false, error: error.message };
     }
  },

  evaluationReady: 85,
  submissionResult: null,
  saveDraft: async (currentWordCount, silent = true) => {
     const state = get();
     if (!state.currentCase?.id || !state.user?.id) return;

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

     try {
         await apiPost('/submissions', {
             case_id: state.currentCase.id,
             learner_id: state.user.id,
             summary_text: state.summaryText,
             draft_nodes: state.nodes,
             draft_edges: state.edges,
             status: 'in_progress',
             word_count: wordCount
         });
         if (!silent) Object.keys(state).includes('addNotification') && state.addNotification('Draft Saved', `Your progress on ${state.currentCase.title} has been backed up.`);
     } catch (error) {
         console.error("Error saving draft:", error);
     }
  },
  fetchDraft: async (caseId) => {
     const state = get();
     if (!state.user?.id || !caseId) return;
     
     try {
         const data = await apiGet(`/submissions/${caseId}/${state.user.id}`);
         if (data && data.status === 'in_progress') {
             if (data.summary_text) set({ summaryText: data.summary_text });
             if (data.draft_nodes) {
                 set({ nodes: parseJsonValue(data.draft_nodes, []) });
             }
             if (data.draft_edges) {
                 set({ edges: parseJsonValue(data.draft_edges, []) });
             }
         }
     } catch (error) {
         console.error("fetchDraft error:", error);
     }
  },
  submitAssignment: async () => {
    try {
      const state = get();
      
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

      if (!state.user?.id || !state.currentCase?.id) {
        throw new Error("Missing user or case information. Please try refreshing.");
      }

      const result = await apiPost('/submissions/submit', {
          case_id: state.currentCase.id,
          learner_id: state.user.id,
          summary_text: state.summaryText,
          draft_keywords: state.keywords,
          draft_nodes: state.nodes,
          draft_edges: state.edges,
          word_count: wordCount,
          keyword_count: keywordCount,
          node_count: nodeCount,
          has_conclusion: hasConclusion
      });

      const score = result.score || 0;
      get().fetchSubmissions();

      if (Object.keys(state).includes('addNotification')) {
          state.addNotification('Case Submitted', `You scored ${score}/100 on ${state.currentCase?.title || 'Case Study'}`);
          const learnerName = state.user?.name || 'Anonymous Learner';
          const caseTitle = state.currentCase?.title || 'Case Study';
          state.usersDb.filter(u => u.role === 'teacher').forEach(teacher => {
            state.addNotification('New Submission', `${learnerName} submitted ${caseTitle} with a score of ${score}/100.`, teacher.id);
          });
      }
      
      const fullResult = { score, wordCount, keywordCount, nodeCount, hasConclusion };
      set({ submissionResult: fullResult });
      return fullResult;
    } catch (error) {
      console.error("Complete submission catch:", error);
      throw error;
    }
  }

});
