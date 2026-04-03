import { supabase, IS_MOCK_MODE } from '../../lib/supabase';

export const createCaseSlice = (set, get) => ({
  cases: [],
  fetchCases: async () => {
     if (IS_MOCK_MODE) return;
     
     const { data, error } = await supabase.from('cases')
          .select('id, title, content, description, created_at, status, attachments, update_history')
          .gte('created_at', '2000-01-01T00:00:00Z')
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
     if (IS_MOCK_MODE || !state.user) return;
     
     let query = supabase
        .from('submissions')
        .select('id, case_id, status, final_grade, created_at, word_count, keyword_count, node_count, has_conclusion, override_history, learner_id, profiles(full_name)')
        .order('created_at', { ascending: false });
        
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
        throw new Error("Missing user or case information. Please try refreshing.");
      }

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

      if (subError) throw new Error(`Database error: ${subError.message}`);
      if (!subData) throw new Error("Failed to save submission metadata.");

      const submissionId = subData.id;

      await supabase.from('keywords').delete().eq('submission_id', submissionId);
      await supabase.from('concept_nodes').delete().eq('submission_id', submissionId);

      if (state.keywords.length > 0) {
          const kws = state.keywords.map(k => ({
              submission_id: submissionId,
              term: k.text,
              category: k.category
          }));
          await supabase.from('keywords').insert(kws);
      }

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
          await supabase.from('concept_nodes').insert(nodesToInsert);
      }

      const { data: evalResult, error: evalError } = await supabase.rpc('evaluate_submission', { p_submission_id: submissionId });
      
      if (evalError) console.error("Evaluation RPC Error:", evalError);

      get().fetchSubmissions();

      const score = evalResult?.score || 0;
      state.addNotification('Case Submitted', `You scored ${score}/100 on ${state.currentCase?.title || 'Case Study'}`);
      
      const learnerName = state.user?.name || 'Anonymous Learner';
      const caseTitle = state.currentCase?.title || 'Case Study';
      state.usersDb.filter(u => u.role === 'teacher').forEach(teacher => {
        state.addNotification('New Submission', `${learnerName} submitted ${caseTitle} with a score of ${score}/100.`, teacher.id);
      });
      
      const fullResult = { ...evalResult, wordCount, keywordCount, nodeCount, hasConclusion };
      set({ submissionResult: fullResult });
      return fullResult;
    } catch (error) {
      console.error("Complete submission catch:", error);
      throw error;
    }
  }

});
