import { apiPost } from '../../lib/api';
import {
  emptyGuidedDraft,
  guidedListKeys,
  getGuidedMissingItems,
  getGuidedStepCompletion,
  normalizeGuidedDraft,
} from '../../lib/guidedCase';

const mapNodeTypeLabels = {
  problemNode: 'Main Problem',
  evidenceNode: 'Evidence',
  causeNode: 'Root Cause',
  solutionNode: 'Possible Solution',
  analysisNode: 'Justification',
  conclusionNode: 'Recommendation',
  noteNode: 'Note',
};

const createMapSummary = (nodes = []) => nodes
  .map(node => `${mapNodeTypeLabels[node.type] || node.type}: ${node.data?.label || ''}`)
  .filter(Boolean)
  .join('\n');

export const createWorkspaceSlice = (set, get) => ({
  caseWorkspaces: {},
  keywords: [],
  guidedDraft: { ...emptyGuidedDraft },
  activeStepIndex: 0,
  summaryText: '',

  setActiveStepIndex: (index) => set({ activeStepIndex: index }),
  setGuidedDraft: (draft) => set({
    guidedDraft: normalizeGuidedDraft(draft),
    summaryText: normalizeGuidedDraft(draft).final_submission,
  }),
  setGuidedField: (key, value) => set((state) => {
    const guidedDraft = normalizeGuidedDraft({
      ...state.guidedDraft,
      [key]: value,
    });
    return {
      guidedDraft,
      summaryText: guidedDraft.final_submission,
    };
  }),
  setSummaryText: (text) => set((state) => ({
    summaryText: text,
    guidedDraft: normalizeGuidedDraft({
      ...state.guidedDraft,
      final_submission: text,
    }),
  })),
  appendSummaryText: (text) => set((state) => {
    const finalSubmission = `${state.guidedDraft.final_submission || ''}\n\n${text}`.trim();
    return {
      summaryText: finalSubmission,
      guidedDraft: normalizeGuidedDraft({
        ...state.guidedDraft,
        final_submission: finalSubmission,
      }),
    };
  }),
  addGuidedListItem: (key, text) => set((state) => {
    if (!guidedListKeys.includes(key) || !text.trim()) return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft);
    return {
      guidedDraft: {
        ...guidedDraft,
        [key]: [...guidedDraft[key], text.trim()],
      },
    };
  }),
  removeGuidedListItem: (key, index) => set((state) => {
    if (!guidedListKeys.includes(key)) return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft);
    return {
      guidedDraft: {
        ...guidedDraft,
        [key]: guidedDraft[key].filter((_, itemIndex) => itemIndex !== index),
      },
    };
  }),
  updateGuidedListItem: (key, index, value) => set((state) => {
    if (!guidedListKeys.includes(key)) return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft);
    return {
      guidedDraft: {
        ...guidedDraft,
        [key]: guidedDraft[key].map((item, itemIndex) => itemIndex === index ? value : item),
      },
    };
  }),
  addSelectedTextToEvidence: (text) => {
    get().addGuidedListItem('evidence', text);
    get().addKeyword?.(text, 'blue');
  },
  copySelectionToCurrentStep: (text) => {
    const state = get();
    const stepKey = ['main_problem', 'evidence', 'root_causes', 'possible_solutions', 'recommendation', 'justification', 'final_submission'][state.activeStepIndex] || 'evidence';
    if (guidedListKeys.includes(stepKey)) {
      state.addGuidedListItem(stepKey, text);
      return;
    }
    const current = state.guidedDraft[stepKey] || '';
    state.setGuidedField(stepKey, `${current}\n${text}`.trim());
  },

  getStepCompletion: () => getGuidedStepCompletion(get().guidedDraft, get().nodes),
  canSubmitGuidedCase: () => getGuidedMissingItems(get().guidedDraft, get().nodes).length === 0,
  getGuidedMissingItems: () => getGuidedMissingItems(get().guidedDraft, get().nodes),

  isGeneratingDraft: false,
  generateDraft: async () => get().generateFinalSubmission(),
  generateFinalSubmission: async () => {
    const state = get();
    set({ isGeneratingDraft: true });

    try {
        const result = await apiPost('/ai/final-submission', {
            caseContent: state.currentCase?.content || state.currentCase?.description || 'No case content provided.',
            guidedDraft: state.guidedDraft,
            mapSummary: createMapSummary(state.nodes),
        });

        const finalSubmission = result.finalSubmission || '';
        set((current) => ({
          summaryText: finalSubmission,
          guidedDraft: normalizeGuidedDraft({
            ...current.guidedDraft,
            final_submission: finalSubmission,
          }),
          isGeneratingDraft: false,
        }));
    } catch (error) {
        console.error("AI Final Submission Error:", error);
        get().addNotification?.('AI Draft Unavailable', 'Manual solving is still available, and your saved work was not changed.');
        set({ isGeneratingDraft: false });
    }
  },

  isExtractingConcepts: false,
  extractConceptsAI: async () => get().extractEvidenceAI(),
  extractEvidenceAI: async () => {
    const state = get();
    const caseContent = state.currentCase?.content || state.currentCase?.description || '';
    if (!caseContent) return;

    set({ isExtractingConcepts: true });
    
    try {
        const result = await apiPost('/ai/evidence', { caseContent });
        const evidence = Array.isArray(result.evidence) ? result.evidence : [];
        set((current) => ({
          guidedDraft: normalizeGuidedDraft({
            ...normalizeGuidedDraft(current.guidedDraft),
            evidence: [...normalizeGuidedDraft(current.guidedDraft).evidence, ...evidence],
          }),
          keywords: [
            ...current.keywords,
            ...evidence.map((text, index) => ({
              id: `ai-evidence-${Date.now()}-${index}`,
              text,
              category: 'blue',
            })),
          ],
          isExtractingConcepts: false,
        }));
    } catch (error) {
        console.error("AI Evidence Extraction Error:", error);
        get().addNotification?.('AI Evidence Unavailable', 'You can keep adding evidence manually from the case reader.');
        set({ isExtractingConcepts: false });
    }
  },
  
  addKeyword: (text, category) => set((state) => ({ 
    keywords: [...state.keywords, { id: 'k' + Date.now(), text, category }]
  })),
  removeKeyword: (id) => set((state) => ({
    keywords: state.keywords.filter(k => k.id !== id)
  })),

  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes: typeof nodes === 'function' ? nodes(get().nodes) : nodes }),
  setEdges: (edges) => set({ edges: typeof edges === 'function' ? edges(get().edges) : edges }),
  updateNodeLabel: (nodeId, newLabel) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n)
  })),
  deleteNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    edges: state.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
  })),
  onNodesChange: () => {},
  
  resetWorkspaceToInitial: () => {
     set({
        keywords: [],
        guidedDraft: { ...emptyGuidedDraft },
        activeStepIndex: 0,
        nodes: [],
        edges: [],
        summaryText: ''
     });
  }
});
