import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { guidedListKeys, guidedStepConfig } from '../lib/guidedCase';
import { Bot, CheckCircle, ChevronLeft, ChevronRight, Cloud, ListPlus, Send, Sparkles, Trash2 } from 'lucide-react';

const getWordCount = (text = '') => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean ? clean.split(/\s+/).length : 0;
};

const stepNodeTypes = {
  main_problem: 'problemNode',
  evidence: 'evidenceNode',
  root_causes: 'causeNode',
  possible_solutions: 'solutionNode',
  recommendation: 'conclusionNode',
  justification: 'analysisNode',
  final_submission: 'noteNode',
};

const GuidedSolver = () => {
  const navigate = useNavigate();
  const {
    guidedDraft,
    activeStepIndex,
    setActiveStepIndex,
    setGuidedField,
    addGuidedListItem,
    removeGuidedListItem,
    updateGuidedListItem,
    saveDraft,
    submitAssignment,
    generateFinalSubmission,
    isGeneratingDraft,
    extractEvidenceAI,
    isExtractingConcepts,
    getStepCompletion,
    getGuidedMissingItems,
    currentCase,
    nodes,
    edges,
  } = useStore();

  const [newListItem, setNewListItem] = useState('');
  const [isSavingDraftBtn, setIsSavingDraftBtn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePulse, setSavePulse] = useState(false);

  const activeStep = guidedStepConfig[activeStepIndex];
  const completion = getStepCompletion();
  const missingItems = getGuidedMissingItems();
  const isListStep = guidedListKeys.includes(activeStep.key);
  const finalWordCount = getWordCount(guidedDraft.final_submission);

  const completedCount = useMemo(
    () => guidedStepConfig.filter(step => completion[step.key]).length,
    [completion]
  );

  useEffect(() => {
    setNewListItem('');
  }, [activeStepIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
      setSavePulse(true);
      setTimeout(() => setSavePulse(false), 700);
    }, 450);

    return () => clearTimeout(timer);
  }, [guidedDraft, activeStepIndex, nodes, edges, saveDraft]);

  const handleAddListItem = (event) => {
    event.preventDefault();
    if (!newListItem.trim()) return;
    addGuidedListItem(activeStep.key, newListItem);
    setNewListItem('');
  };

  const handleSaveDraft = async () => {
    setIsSavingDraftBtn(true);
    await saveDraft(undefined, false);
    setIsSavingDraftBtn(false);
  };

  const handleSubmit = async () => {
    if (missingItems.length > 0) {
      alert(`Complete these items before submitting:\n\n${missingItems.join('\n')}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await submitAssignment();
      navigate(`/results/${currentCase?.id || 'demo'}`);
    } catch (error) {
      alert(error.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-dark p-4 md:p-6 w-full">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden w-full">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">Guided Case Solver</h3>
                <p className="text-sm text-slate-400 mt-1">Complete each step, then build the required concept map before final submission.</p>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded border ${savePulse ? 'text-amber-400 bg-amber-900/20 border-amber-900/50' : 'text-emerald-400 bg-emerald-900/20 border-emerald-900/50'}`}>
                <Cloud size={14} />
                <span>{savePulse ? 'Saving...' : 'Auto-saved'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
              {guidedStepConfig.map((step, index) => (
                <button
                  key={step.key}
                  onClick={() => setActiveStepIndex(index)}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    activeStepIndex === index
                      ? 'bg-primary text-white border-primary'
                      : completion[step.key]
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold">{index + 1}. {step.shortTitle}</span>
                  {completion[step.key] && <CheckCircle size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Step {activeStepIndex + 1} of {guidedStepConfig.length}</p>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">{activeStep.title}</h2>
              <p className="text-slate-400 mt-2">{activeStep.helper}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</p>
              <p className="text-lg font-bold text-slate-200">{completedCount}/{guidedStepConfig.length}</p>
            </div>
          </div>

          {isListStep ? (
            <div className="space-y-4">
              <form onSubmit={handleAddListItem} className="flex gap-3">
                <input
                  value={newListItem}
                  onChange={(event) => setNewListItem(event.target.value)}
                  placeholder={activeStep.placeholder}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!newListItem.trim()}
                  className="px-4 py-3 bg-primary text-white rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  <ListPlus size={18} />
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {guidedDraft[activeStep.key].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center text-slate-500">
                    No entries yet. Add one manually or select text from the case reader.
                  </div>
                ) : (
                  guidedDraft[activeStep.key].map((item, index) => (
                    <div
                      key={`${activeStep.key}-${index}`}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', stepNodeTypes[activeStep.key] || 'noteNode');
                        event.dataTransfer.setData('application/label', item);
                        event.dataTransfer.setData('text/plain', item);
                        event.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      className="flex gap-3 rounded-xl border border-slate-800 bg-slate-800/50 p-3 cursor-grab active:cursor-grabbing"
                    >
                      <textarea
                        value={item}
                        onChange={(event) => updateGuidedListItem(activeStep.key, index, event.target.value)}
                        rows={2}
                        className="flex-1 resize-none bg-transparent text-sm text-slate-200 outline-none"
                      />
                      <button
                        onClick={() => removeGuidedListItem(activeStep.key, index)}
                        className="self-start p-2 text-slate-500 hover:text-rose-400"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <textarea
              value={guidedDraft[activeStep.key]}
              onChange={(event) => setGuidedField(activeStep.key, event.target.value)}
              placeholder={activeStep.placeholder}
              rows={activeStep.type === 'textarea' ? 12 : 6}
              className="w-full resize-none rounded-xl bg-slate-800 border border-slate-700 p-4 text-slate-100 focus:outline-none focus:border-primary leading-relaxed custom-scrollbar"
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <button
              onClick={extractEvidenceAI}
              disabled={isExtractingConcepts}
              className="flex items-center justify-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50"
            >
              <Bot size={16} />
              {isExtractingConcepts ? 'Extracting evidence...' : 'AI Extract Evidence'}
            </button>
            <button
              onClick={generateFinalSubmission}
              disabled={isGeneratingDraft}
              className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {isGeneratingDraft ? 'Drafting final submission...' : 'AI Draft Final Submission'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-400">
            <span><strong className="text-slate-200">{finalWordCount}</strong> final-submission words</span>
            <span className={completion.map ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {completion.map ? 'Concept map requirements met' : 'Concept map still required'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
              disabled={activeStepIndex === 0}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setActiveStepIndex(Math.min(guidedStepConfig.length - 1, activeStepIndex + 1))}
              disabled={activeStepIndex === guidedStepConfig.length - 1}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              Next
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSavingDraftBtn}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isSavingDraftBtn ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={16} />
              {isSubmitting ? 'Submitting...' : 'Final Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedSolver;
