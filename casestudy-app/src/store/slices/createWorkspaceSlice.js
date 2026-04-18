import { apiPost } from '../../lib/api';
import {
  emptyGuidedDraft,
  getGuidedMissingItems,
  getGuidedStepCompletion,
  normalizeGuidedDraft,
  getActiveStepConfig,
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
  setGuidedDraft: (draft) => set((state) => ({
    guidedDraft: normalizeGuidedDraft(draft, state.currentCase?.customSteps),
    summaryText: normalizeGuidedDraft(draft, state.currentCase?.customSteps).final_submission,
  })),
  setGuidedField: (key, value) => set((state) => {
    const guidedDraft = normalizeGuidedDraft({
      ...state.guidedDraft,
      [key]: value,
    }, state.currentCase?.customSteps);
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
    }, state.currentCase?.customSteps),
  })),
  appendSummaryText: (text) => set((state) => {
    const finalSubmission = `${state.guidedDraft.final_submission || ''}\n\n${text}`.trim();
    return {
      summaryText: finalSubmission,
      guidedDraft: normalizeGuidedDraft({
        ...state.guidedDraft,
        final_submission: finalSubmission,
      }, state.currentCase?.customSteps),
    };
  }),
  addGuidedListItem: (key, text) => set((state) => {
    const config = getActiveStepConfig(state.currentCase?.requiredSteps, state.currentCase?.customSteps);
    const stepDef = config.find(s => s.key === key);
    if (!stepDef || stepDef.type !== 'list' || !text.trim()) return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft, state.currentCase?.customSteps);
    return {
      guidedDraft: {
        ...guidedDraft,
        [key]: [...guidedDraft[key], text.trim()],
      },
    };
  }),
  removeGuidedListItem: (key, index) => set((state) => {
    const config = getActiveStepConfig(state.currentCase?.requiredSteps, state.currentCase?.customSteps);
    const stepDef = config.find(s => s.key === key);
    if (!stepDef || stepDef.type !== 'list') return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft, state.currentCase?.customSteps);
    return {
      guidedDraft: {
        ...guidedDraft,
        [key]: guidedDraft[key].filter((_, itemIndex) => itemIndex !== index),
      },
    };
  }),
  updateGuidedListItem: (key, index, value) => set((state) => {
    const config = getActiveStepConfig(state.currentCase?.requiredSteps, state.currentCase?.customSteps);
    const stepDef = config.find(s => s.key === key);
    if (!stepDef || stepDef.type !== 'list') return {};
    const guidedDraft = normalizeGuidedDraft(state.guidedDraft, state.currentCase?.customSteps);
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
    const config = getActiveStepConfig(state.currentCase?.requiredSteps, state.currentCase?.customSteps);
    const safeIndex = Math.min(state.activeStepIndex, config.length - 1 >= 0 ? config.length - 1 : 0);
    const stepDef = config[safeIndex];
    if (!stepDef) return;
    
    if (stepDef.type === 'list') {
      state.addGuidedListItem(stepDef.key, text);
      return;
    }
    const current = state.guidedDraft[stepDef.key] || '';
    state.setGuidedField(stepDef.key, `${current}\n${text}`.trim());
  },

  getStepCompletion: () => getGuidedStepCompletion(get().guidedDraft, get().nodes, get().currentCase?.customSteps),
  canSubmitGuidedCase: () => getGuidedMissingItems(get().guidedDraft, get().nodes, get().currentCase?.requiredSteps, get().currentCase?.customSteps).length === 0,
  getGuidedMissingItems: () => getGuidedMissingItems(get().guidedDraft, get().nodes, get().currentCase?.requiredSteps, get().currentCase?.customSteps),

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
          }, current.currentCase?.customSteps),
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
            ...normalizeGuidedDraft(current.guidedDraft, current.currentCase?.customSteps),
            evidence: [...normalizeGuidedDraft(current.guidedDraft, current.currentCase?.customSteps).evidence, ...evidence],
          }, current.currentCase?.customSteps),
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
