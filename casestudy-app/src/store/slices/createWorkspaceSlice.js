import { GoogleGenerativeAI } from '@google/generative-ai';

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
