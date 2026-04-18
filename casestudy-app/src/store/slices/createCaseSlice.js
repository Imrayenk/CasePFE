import { apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';
import { emptyGuidedDraft, getGuidedMissingItems, normalizeGuidedDraft } from '../../lib/guidedCase';

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
             const parsedRequiredSteps = parseJsonValue(c.required_steps, null);
             const parsedCustomSteps = parseJsonValue(c.custom_steps, []);

             return {
                 id: c.id,
                 title: c.title,
                 content: c.content,
                 description: c.description || '',
                 date: new Date(c.createdAt).toISOString().split('T')[0],
                 status: c.status === 'draft' ? 'Draft' : (c.status === 'active' ? 'Active' : 'Closed'),
                 attachments: parsedAttachments,
                 updateHistory: parsedHistory,
                 requiredSteps: parsedRequiredSteps,
                 customSteps: parsedCustomSteps,
                 subjectId: c.subjectId
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
              required_steps: newCase.requiredSteps || null,
              custom_steps: newCase.customSteps || [],
              teacherId: get().user?.id,
              subjectId: newCase.subjectId
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
              update_history: updatedCase.updateHistory || [],
              required_steps: updatedCase.requiredSteps || null,
              custom_steps: updatedCase.customSteps || [],
              subjectId: updatedCase.subjectId
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
          guidedDraft: state.guidedDraft,
          activeStepIndex: state.activeStepIndex,
          summaryText: state.summaryText,
          nodes: state.nodes,
          edges: state.edges
       };
    }

    const targetCaseWorkspace = newCaseWorkspaces[id] || {
       keywords: [],
       guidedDraft: { ...emptyGuidedDraft },
       activeStepIndex: 0,
       summaryText: '',
       nodes: [],
       edges: []
    };
    const normalizedGuidedDraft = normalizeGuidedDraft(targetCaseWorkspace.guidedDraft || {
       final_submission: targetCaseWorkspace.summaryText || ''
    });

    return { 
       currentCase: state.cases.find(c => c.id === id) || null,
       caseWorkspaces: newCaseWorkspaces,
       keywords: targetCaseWorkspace.keywords,
       guidedDraft: normalizedGuidedDraft,
       activeStepIndex: targetCaseWorkspace.activeStepIndex || 0,
       summaryText: normalizedGuidedDraft.final_submission || targetCaseWorkspace.summaryText || '',
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
                     learnerId: s.learnerId,
                     learnerName: s.learner?.name || 'Unknown Learner',
                     caseId: s.caseId,
                     status: s.status === 'in_progress' ? 'In Progress' : (s.status === 'submitted' ? 'Submitted for Review' : (s.status === 'graded' ? 'Graded' : 'Graded (Override)')),
                     score: s.final_grade,
                     date: new Date(s.createdAt).toISOString().split('T')[0],
                     submittedAt: s.submittedAt,
                     wordCount: s.word_count || 0,
                     keywords: s.keyword_count || 0,
                     nodes: s.node_count || 0,
                     hasConclusion: s.has_conclusion || false,
                     teacherFeedback: s.teacher_feedback || '',
                     overrideHistory: parsedHistory
                 };
             });
             set({ submissions: mappedSubmissions });
         }
     } catch (error) {
         console.error("fetchSubmissions error:", error);
     }
  },
  updateSubmissionScore: async (id, newScore, teacherFeedback = '') => {
     const state = get();
     const sub = state.submissions.find(s => s.id === id);
     const oldScore = sub?.score ?? null;
     const history = sub ? [...(sub.overrideHistory || [])] : [];
     
     if (oldScore !== null && oldScore !== Number(newScore)) {
         history.push({
             timestamp: new Date().toISOString(),
             oldScore,
             newScore,
             teacherName: state.user?.name || 'Instructor'
         });
     }

     try {
         await apiPut(`/submissions/${id}/score`, { newScore, history, teacher_feedback: teacherFeedback });
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

     try {
         await apiPost('/submissions', {
             case_id: state.currentCase.id,
             guidedDraft: state.guidedDraft,
             summary_text: state.guidedDraft.final_submission,
             draft_nodes: state.nodes,
             draft_edges: state.edges,
             current_step: state.activeStepIndex,
             status: 'in_progress',
             word_count: currentWordCount || 0
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
             const guidedDraft = normalizeGuidedDraft(data.guidedDraft || {});
             set({
                 guidedDraft,
                 summaryText: guidedDraft.final_submission || data.summary_text || '',
                 activeStepIndex: data.current_step || 0,
                 nodes: parseJsonValue(data.draft_nodes, []),
                 edges: parseJsonValue(data.draft_edges, [])
             });
         }
     } catch (error) {
         console.error("fetchDraft error:", error);
     }
  },
  submitAssignment: async () => {
    try {
      const state = get();
      const missingItems = getGuidedMissingItems(
        state.guidedDraft, 
        state.nodes, 
        state.currentCase?.requiredSteps, 
        state.currentCase?.customSteps
      );
      if (missingItems.length > 0) {
        throw new Error(`Complete these items before submitting: ${missingItems.join(', ')}`);
      }

      if (!state.user?.id || !state.currentCase?.id) {
        throw new Error("Missing user or case information. Please try refreshing.");
      }

      const result = await apiPost('/submissions/submit', {
          case_id: state.currentCase.id,
          guidedDraft: state.guidedDraft,
          summary_text: state.guidedDraft.final_submission,
          draft_nodes: state.nodes,
          draft_edges: state.edges,
          current_step: 6
      });

      get().fetchSubmissions();

      if (Object.keys(state).includes('addNotification')) {
          state.addNotification('Case Submitted', `${state.currentCase?.title || 'Case Study'} has been sent for teacher review.`);
          const learnerName = state.user?.name || 'Anonymous Learner';
          const caseTitle = state.currentCase?.title || 'Case Study';
          state.usersDb.filter(u => u.role === 'teacher').forEach(teacher => {
            state.addNotification('New Submission', `${learnerName} submitted ${caseTitle} for review.`, teacher.id);
          });
      }
      
      const fullResult = {
        score: result.score,
        status: 'Submitted for Review',
        guidedDraft: state.guidedDraft,
        nodeCount: state.nodes.length,
        teacherFeedback: '',
      };
      set({ submissionResult: fullResult });
      return fullResult;
    } catch (error) {
      console.error("Complete submission catch:", error);
      throw error;
    }
  }

});
