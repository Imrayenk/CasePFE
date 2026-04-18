export const guidedStepConfig = [
  {
    key: 'main_problem',
    title: 'Main Problem',
    shortTitle: 'Problem',
    helper: 'State the central problem the case asks you to solve.',
    type: 'text',
    placeholder: 'What is the main problem?',
  },
  {
    key: 'evidence',
    title: 'Evidence',
    shortTitle: 'Evidence',
    helper: 'Collect facts, quotes, figures, or events from the case.',
    type: 'list',
    placeholder: 'Add evidence from the case...',
  },
  {
    key: 'root_causes',
    title: 'Root Causes',
    shortTitle: 'Causes',
    helper: 'Identify what is driving the main problem.',
    type: 'list',
    placeholder: 'Add a root cause...',
  },
  {
    key: 'possible_solutions',
    title: 'Possible Solutions',
    shortTitle: 'Solutions',
    helper: 'List plausible actions before choosing one recommendation.',
    type: 'list',
    placeholder: 'Add a possible solution...',
  },
  {
    key: 'recommendation',
    title: 'Recommendation',
    shortTitle: 'Recommend',
    helper: 'Choose the best solution and say what should happen.',
    type: 'text',
    placeholder: 'What do you recommend?',
  },
  {
    key: 'justification',
    title: 'Justification',
    shortTitle: 'Justify',
    helper: 'Explain why your recommendation is stronger than the alternatives.',
    type: 'textarea',
    placeholder: 'Why is this the best recommendation?',
  },
  {
    key: 'final_submission',
    title: 'Final Submission',
    shortTitle: 'Submit',
    helper: 'Write the final response your instructor will review.',
    type: 'textarea',
    placeholder: 'Write your final case solution...',
  },
];

export const emptyGuidedDraft = {
  main_problem: '',
  evidence: [],
  root_causes: [],
  possible_solutions: [],
  recommendation: '',
  justification: '',
  final_submission: '',
};

export const guidedListKeys = ['evidence', 'root_causes', 'possible_solutions'];

export const requiredMapNodeTypes = [
  'problemNode',
  'evidenceNode',
  'causeNode',
  'solutionNode',
  'conclusionNode',
];

export function normalizeGuidedDraft(value = {}, customSteps = []) {
  const result = {
    ...emptyGuidedDraft,
    ...value,
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    root_causes: Array.isArray(value.root_causes) ? value.root_causes : [],
    possible_solutions: Array.isArray(value.possible_solutions) ? value.possible_solutions : [],
  };

  customSteps.forEach(step => {
     if (step.type === 'list') {
        result[step.key] = Array.isArray(value[step.key]) ? value[step.key] : [];
     } else {
        result[step.key] = value[step.key] || '';
     }
  });

  return result;
}

export function getGuidedStepCompletion(guidedDraft, nodes = [], customSteps = []) {
  const draft = normalizeGuidedDraft(guidedDraft, customSteps);
  const nodeTypes = new Set(nodes.map(node => node.type));

  const completion = {
    main_problem: draft.main_problem.trim().length > 0,
    evidence: draft.evidence.length > 0,
    root_causes: draft.root_causes.length > 0,
    possible_solutions: draft.possible_solutions.length > 0,
    recommendation: draft.recommendation.trim().length > 0,
    justification: draft.justification.trim().length > 0,
    final_submission: draft.final_submission.trim().length > 0,
    map: requiredMapNodeTypes.every(type => nodeTypes.has(type)),
  };

  customSteps.forEach(step => {
      if (step.type === 'list') {
          completion[step.key] = draft[step.key].length > 0;
      } else {
          completion[step.key] = draft[step.key].trim().length > 0;
      }
  });

  return completion;
}

export function getActiveStepConfig(requiredSteps = null, customSteps = []) {
  const baseConfig = requiredSteps 
      ? guidedStepConfig.filter(s => requiredSteps.includes(s.key)) 
      : guidedStepConfig.filter(s => s.key !== 'final_submission');

  return [
      ...baseConfig.filter(s => s.key !== 'final_submission'),
      ...customSteps,
      guidedStepConfig.find(s => s.key === 'final_submission')
  ];
}

export function getGuidedMissingItems(guidedDraft, nodes = [], requiredSteps = null, customSteps = []) {
  const completion = getGuidedStepCompletion(guidedDraft, nodes, customSteps);
  const missing = [];

  const activeConfig = getActiveStepConfig(requiredSteps, customSteps);

  activeConfig.forEach(step => {
    if (!completion[step.key]) missing.push(step.title);
  });
  if (!completion.map) missing.push('Required concept map nodes');

  return missing;
}
