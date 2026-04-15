import { apiPost } from '../../lib/api';

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

export const createWorkspaceSlice = (set, get) => ({
  caseWorkspaces: {},
  keywords: [...initialKeywords],
  summaryText: '',
  setSummaryText: (text) => set({ summaryText: text }),
  appendSummaryText: (text) => set(state => ({ summaryText: state.summaryText + `<p>${text}</p>` })),
  
  isGeneratingDraft: false,
  generateDraft: async () => {
    const state = get();
    
    if (state.keywords.length === 0 && state.nodes.length === 0) {
        set({ summaryText: '<p><em>Please extract some keywords from the case study or build a Concept Map first so I can generate a tailored draft.</em></p>' });
        return;
    }

    set({ isGeneratingDraft: true, summaryText: '<p><em>Synthesizing your workspace data using local AI...</em></p>' });
    
    try {
        let logicalMapString = '';
        
        const problems = state.nodes.filter(n => n.type === 'problemNode');
        if (problems.length > 0) logicalMapString += `Identified Problem(s): ${problems.map(n => n.data.label).join('; ')}\n`;

        const causes = state.nodes.filter(n => n.type === 'causeNode');
        if (causes.length > 0) logicalMapString += `Root Cause(s): ${causes.map(n => n.data.label).join('; ')}\n`;

        const analyses = state.nodes.filter(n => n.type === 'analysisNode');
        if (analyses.length > 0) logicalMapString += `Analysis: ${analyses.map(n => n.data.label).join('; ')}\n`;

        const evidence = state.nodes.filter(n => n.type === 'evidenceNode');
        if (evidence.length > 0) logicalMapString += `Supporting Evidence: ${evidence.map(n => n.data.label).join('; ')}\n`;

        const solutions = state.nodes.filter(n => n.type === 'solutionNode');
        if (solutions.length > 0) logicalMapString += `Proposed Solution(s): ${solutions.map(n => n.data.label).join('; ')}\n`;

        const conclusions = state.nodes.filter(n => n.type === 'conclusionNode');
        if (conclusions.length > 0) logicalMapString += `Conclusion: ${conclusions.map(n => n.data.label).join('; ')}\n`;

        const notes = state.nodes.filter(n => n.type === 'noteNode');
        if (notes.length > 0) logicalMapString += `Additional Notes: ${notes.map(n => n.data.label).join('; ')}\n`;

        const payload = {
            caseContent: state.currentCase?.content || state.currentCase?.description || 'No case content provided.',
            keywords: state.keywords.map(k => k.text),
            logicalMapString
        };

        const result = await apiPost('/ai/draft', payload);
        set({ summaryText: result.draftHtml, isGeneratingDraft: false });
    } catch (error) {
        console.error("AI Generation Error:", error);
        set({ summaryText: `<p><em>Error generating draft: ${error.message}. Please check that the local AI backend is running and try again.</em></p>`, isGeneratingDraft: false });
    }
  },

  isExtractingConcepts: false,
  extractConceptsAI: async () => {
    const state = get();
    
    const caseContent = state.currentCase?.content || state.currentCase?.description || '';
    if (!caseContent) return;

    set({ isExtractingConcepts: true });
    
    try {
        const payload = { caseContent };
        const result = await apiPost('/ai/concepts', payload);
        const extracted = result.concepts;
        
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
        console.error("AI Extraction Error:", error);
        set({ summaryText: `<p><em>Error extracting concepts: ${error.message}. Check console for details.</em></p>`, isExtractingConcepts: false });
    }
  },
  
  addKeyword: (text, category) => set((state) => ({ 
    keywords: [...state.keywords, { id: 'k' + Date.now(), text, category }]
  })),
  removeKeyword: (id) => set((state) => ({
    keywords: state.keywords.filter(k => k.id !== id)
  })),

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
  onNodesChange: () => {},
  
  resetWorkspaceToInitial: () => {
     set({
        keywords: [...initialKeywords],
        nodes: [...initialNodes],
        edges: [...initialEdges],
        summaryText: ''
     });
  }
});
