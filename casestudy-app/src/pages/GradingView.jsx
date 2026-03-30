import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, Edit3, Send, CheckCircle, AlertTriangle, FileText, Network, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReadOnlyConceptMapper from '../components/ReadOnlyConceptMapper';

const GradingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, submissions, updateSubmissionScore } = useStore();
  
  const submission = submissions.find(s => s.id === id);
  const [overrideScore, setOverrideScore] = useState(submission?.score || 0);
  
  const caseObj = submission ? cases.find(c => c.id === submission.caseId) : null;
  const caseTitle = caseObj ? caseObj.title : 'Unknown Case';

  const [details, setDetails] = useState({
      summary_text: '',
      draft_nodes: [],
      draft_edges: [],
      isLoading: true,
      error: null
  });

  useEffect(() => {
    // If submissions are empty (e.g., page reload), fetch them
    if (submissions.length === 0) {
        useStore.getState().fetchSubmissions();
    }
  }, [submissions.length]);

  useEffect(() => {
    if (submission) {
        setOverrideScore(submission.score || 0);
    }
    const fetchDetails = async () => {
        try {
            const { data, error } = await supabase
              .from('submissions')
              .select('summary_text, draft_nodes, draft_edges')
              .eq('id', id)
              .single();

            if (error) throw error;

            setDetails({
                summary_text: data.summary_text || '',
                draft_nodes: data.draft_nodes || [],
                draft_edges: data.draft_edges || [],
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error('Failed to load submission details:', error);
            setDetails(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    if (id) {
        fetchDetails();
    }
  }, [id, submission]);

  const [saveStatus, setSaveStatus] = useState({ status: 'idle', message: '' });

  if (!submission) {
    return (
        <div className="flex-1 p-8 bg-background-dark flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                 <span className="material-symbols-outlined animate-spin text-slate-500 text-3xl">sync</span>
                 <p className="text-slate-400">Loading submission data...</p>
             </div>
        </div>
    );
  }

  const handleOverride = async () => {
    setSaveStatus({ status: 'saving', message: '' });
    const result = await updateSubmissionScore(id, parseInt(overrideScore));
    if (result && !result.success) {
        setSaveStatus({ status: 'error', message: result.error });
    } else {
        setSaveStatus({ status: 'success', message: 'Saved!' });
        setTimeout(() => setSaveStatus({ status: 'idle', message: '' }), 3000);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background-dark">
      <div className="max-w-7xl mx-auto space-y-8 mt-6">
        
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Reviewing: {submission.learnerName}</h1>
                <p className="text-slate-400 text-sm">Ref: {submission.id.split('-')[0].toUpperCase()} | Case: {caseTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl shadow-lg">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated Grade</span>
                <span className="text-2xl font-bold text-emerald-400">{submission.score} / 100</span>
             </div>
             <div className="h-10 w-px bg-slate-700 mx-2"></div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Edit3 size={12}/> Override Grade</span>
                <input 
                  type="number" 
                  value={overrideScore} 
                  onChange={(e) => setOverrideScore(e.target.value)} 
                  className="bg-slate-800 border-none outline-none focus:ring-1 focus:ring-primary rounded py-1 px-2 text-white font-bold w-20 text-center"
                />
             </div>
             <div className="relative flex flex-col items-center ml-2">
                 <button onClick={handleOverride} disabled={saveStatus.status === 'saving'} className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap disabled:opacity-50">
                   {saveStatus.status === 'saving' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <Send size={16}/>} 
                   {saveStatus.status === 'saving' ? 'Saving...' : 'Save Override'}
                 </button>
                 {saveStatus.status === 'success' && <span className="text-emerald-400 text-[10px] font-bold absolute -bottom-4 translate-y-1 animate-in fade-in slide-in-from-top-1">Grade saved!</span>}
                 {saveStatus.status === 'error' && <span className="text-rose-400 text-[10px] font-bold absolute -bottom-4 translate-y-1 animate-in fade-in slide-in-from-top-1 whitespace-nowrap truncate w-24" title={saveStatus.message}>Update failed</span>}
             </div>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Breakdowns Workspace */}
            <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-6">
                   <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                     <CheckCircle className="text-emerald-500" size={18}/> Evaluation Breakdown
                   </h3>
                   
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">Word Count ({submission.wordCount} words)</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Target 50-200 words (30 pts max)</span>
                        </div>
                        <span className="font-bold text-emerald-400">+ {submission.wordCount >= 50 && submission.wordCount <= 200 ? 30 : (submission.wordCount > 0 ? 15 : 0)}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">Keyword Extraction ({submission.keywords} found)</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">8 pts per keyword (40 pts max)</span>
                        </div>
                        <span className="font-bold text-emerald-400">+ {Math.min(submission.keywords * 8, 40)}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">Concept Map Logic ({submission.nodes} nodes)</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">5 pts per node (20 pts max)</span>
                        </div>
                        <span className="font-bold text-emerald-400">+ {Math.min(submission.nodes * 5, 20)}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">Conclusion Drawn</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Requires a conclusion node (10 pts)</span>
                        </div>
                        <span className="font-bold text-emerald-400">+ {submission.hasConclusion ? '10' : '0'}</span>
                      </div>
                    </div>
                </div>

                {submission?.overrideHistory?.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                       <History className="text-purple-400" size={18}/> Override History
                    </h3>
                    <div className="space-y-3">
                      {submission.overrideHistory.map((entry, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="flex justify-between items-center text-xs text-slate-400">
                             <span className="font-bold">{entry.teacherName}</span>
                             <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-sm font-semibold text-slate-200 mt-1">
                             Changed grade from <span className="text-amber-400">{entry.oldScore}</span> to <span className="text-emerald-400">{entry.newScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Readonly Summary/Map Display Area */}
            <div className="xl:col-span-2 flex flex-col gap-8">
               
               {/* Summary Text Area */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText className="text-indigo-400" size={18}/> Submitted Summary
                  </h3>
                  
                  {details.isLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <span className="material-symbols-outlined animate-spin text-slate-500 text-3xl">sync</span>
                    </div>
                  ) : details.error ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                       Error loading summary: {details.error}
                    </div>
                  ) : (
                    <div className="bg-slate-800/50 p-6 rounded-lg text-slate-300 prose prose-invert max-w-none text-sm leading-relaxed break-words overflow-y-auto overflow-x-hidden max-h-[400px] custom-scrollbar" dangerouslySetInnerHTML={{ __html: details.summary_text || '<p class="text-slate-500 italic">No summary provided.</p>' }} />
                  )}
               </div>

               {/* React Flow Map Area */}
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4 flex-1">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Network className="text-sky-400" size={18}/> Concept Map
                    </div>
                    {!details.isLoading && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{details.draft_nodes.length} Nodes</span>
                    )}
                  </h3>
                  
                  <div className="flex-1 min-h-[500px] bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                     {details.isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined animate-spin text-slate-500 text-3xl">sync</span>
                        </div>
                     ) : details.error ? (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                           <div className="text-rose-400 text-sm">{details.error}</div>
                        </div>
                     ) : (details.draft_nodes && details.draft_nodes.length > 0) ? (
                        <ReadOnlyConceptMapper nodes={details.draft_nodes} edges={details.draft_edges} />
                     ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                           <Network size={32} className="opacity-20"/>
                           <p className="text-sm">No concept map was submitted.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
        </section>

      </div>
    </div>
  );
};

export default GradingView;
