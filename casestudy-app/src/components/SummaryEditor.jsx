import React, { useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Cloud, Sparkles, Send, X, Bot } from 'lucide-react';

const quillModules = {
  toolbar: [
    ['bold', 'italic'],
    [{ 'list': 'bullet' }]
  ]
};

const SummaryEditor = ({ setActiveTab }) => {
  const navigate = useNavigate();
  const { summaryText, setSummaryText, keywords, removeKeyword, submitAssignment, saveDraft, generateDraft, isGeneratingDraft, extractConceptsAI, isExtractingConcepts } = useStore();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraftBtn, setIsSavingDraftBtn] = useState(false);

  // Derived state
  const spacedHtml = summaryText
      .replace(/<p>|<br\s*\/?>|<li>|<ol>|<ul>|<div>|<h1>|<h2>|<h3>/gi, ' ')
      .replace(/<\/p>|<\/li>|<\/ol>|<\/ul>|<\/div>|<\/h1>|<\/h2>|<\/h3>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/ig, ' ')
      .replace(/&[a-z]+;/ig, ' ');
      
  const plainText = spacedHtml.replace(/\s+/g, ' ').trim();
  const wordCount = plainText === '' ? 0 : plainText.split(/\s+/).length;
  const isWordCountValid = wordCount >= 50 && wordCount <= 200;
  
  let readingTime = '0';
  if (wordCount > 0 && wordCount < 200) readingTime = '< 1';
  else if (wordCount >= 200) readingTime = Math.ceil(wordCount / 200).toString();

  // Real auto-save implementation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(wordCount);
    }, 200); // Instant feel (200ms)

    return () => clearTimeout(timer);
  }, [summaryText, keywords, wordCount, saveDraft]);

  const handleTextChange = (content, delta, source, editor) => {
    setSummaryText(content);
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500); 
  };

  const handleFinalize = async () => {
    try {
      setIsSubmitting(true);
      const result = await submitAssignment();
      if (result) {
        navigate(`/results/${useStore.getState().currentCase?.id || 'demo'}`);
      } else {
        alert("Submission failed. Please check your connection and try again.");
      }
    } catch (error) {
      console.error("Finalize Error:", error);
      alert("An unexpected error occurred during submission: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraftBtn(true);
    await saveDraft(wordCount, false);
    setIsSavingDraftBtn(false);
  };

  return (
    <div className="flex flex-col h-full bg-background-dark p-4 md:p-6 w-full">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden w-full transition-all">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-slate-200">Summary Editor</h3>
            {isSaving ? (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium bg-amber-900/20 px-2 py-1 rounded border border-amber-900/50">
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    <span>Saving...</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50">
                    <Cloud size={14} />
                    <span>Auto-saved</span>
                </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={generateDraft}
              disabled={isGeneratingDraft}
              className="text-xs font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                {isGeneratingDraft ? <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span> : <Sparkles size={14}/>} 
                {isGeneratingDraft ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
        </div>

        {/* Text Area Content */}
        <div className="flex-1 flex flex-col relative overflow-hidden custom-quill-container">
          {/* Keywords Suggestion Box Container */}
          <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-primary"/>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extracted Concepts ({keywords.length})</span>
                  </div>
                  <button 
                    onClick={extractConceptsAI}
                    disabled={isExtractingConcepts}
                    className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isExtractingConcepts ? <span className="material-symbols-outlined text-[12px] animate-spin">autorenew</span> : <Bot size={12} />}
                    {isExtractingConcepts ? 'Extracting...' : 'Auto-Extract'}
                  </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {keywords.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Select text in the Case Reader to extract concepts.</p>
                  ) : (
                      keywords.map(kw => (
                      <div 
                          key={kw.id} 
                          draggable
                          onDragStart={(e) => {
                              const nodeType = kw.category === 'blue' ? 'evidenceNode' : 'noteNode';
                              e.dataTransfer.setData('application/reactflow', nodeType);
                              e.dataTransfer.setData('application/label', kw.text);
                              e.dataTransfer.setData('text/plain', kw.text);
                              e.dataTransfer.effectAllowed = 'copyMove';
                          }}
                          className={`group cursor-grab active:cursor-grabbing text-[11px] font-medium pl-2 pr-1 py-1 border rounded-md shadow-sm flex items-center gap-1 transition-all hover:scale-105 ${
                          kw.category === 'yellow' ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-blue-900/20 border-blue-700/50 text-blue-200'
                      }`}>
                          {kw.text}
                          <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={(e) => { e.stopPropagation(); removeKeyword(kw.id); }} 
                            className="p-0.5 rounded-sm hover:bg-slate-900/30 transition-colors"
                            title="Remove Concept"
                          >
                            <X size={12} className="opacity-60 group-hover:opacity-100" />
                          </button>
                      </div>
                      ))
                  )}
              </div>
          </div>

          <ReactQuill 
            theme="snow"
            value={summaryText}
            onChange={handleTextChange}
            modules={quillModules}
            placeholder="Start typing your compliance summary here. Target 50 - 200 words based on extracted keywords..."
            className="flex-1 flex flex-col min-h-0 text-slate-200 bg-background-dark/50"
          />
        </div>

        {/* Footer Settings & Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Word Count</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${isWordCountValid ? 'text-emerald-400' : (wordCount > 0 ? 'text-amber-500' : 'text-slate-200')}`}>
                    {wordCount} words
                </span>
                <div className="w-24 md:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all ${
                      isWordCountValid ? 'bg-emerald-500 w-[60%]' : (wordCount > 200 ? 'bg-rose-500 w-[100%]' : 'bg-amber-500 w-[20%]')
                  }`}></div>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Target: 50-200</span>
              </div>
            </div>
            <div className="hidden md:block h-10 w-px bg-slate-800"></div>
            <div className="hidden md:flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reading Time</span>
              <span className="text-sm font-bold text-slate-200">~{readingTime} min</span>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button 
                onClick={handleSaveDraft}
                disabled={isSavingDraftBtn}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {isSavingDraftBtn ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                {isSavingDraftBtn ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
                onClick={handleFinalize}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <Send size={16}/>}
                Finalize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryEditor;
