import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { submissionResult, submissions, fetchSubmissions } = useStore();

  useEffect(() => {
    if (submissions.length === 0) {
      fetchSubmissions();
    }
  }, [submissions.length, fetchSubmissions]);

  let activeResult = submissionResult;
  if (!activeResult && id) {
     const existingSub = submissions.find(s => s.caseId === id);
     if (existingSub) {
         activeResult = {
             score: existingSub.score,
             wordCount: existingSub.wordCount,
             keywordCount: existingSub.keywords,
             nodeCount: existingSub.nodes,
             hasConclusion: existingSub.hasConclusion,
             status: existingSub.status,
             overrideHistory: existingSub.overrideHistory
         };
     }
  }

  if (!activeResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Loading or Not Found</h2>
        <p className="text-slate-400 mb-6">If you just loaded this page, we are checking your records...</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white font-semibold flex items-center gap-2">
            <ArrowLeft size={18} /> Return to Dashboard
        </button>
      </div>
    );
  }

  const { score, wordCount, keywordCount, nodeCount, hasConclusion, status, overrideHistory } = activeResult;

  const hasHistory = status === 'Graded (Override)' && overrideHistory?.length > 0;
  const originalGrade = hasHistory ? overrideHistory[0].oldScore : null;
  const isOverridden = hasHistory && originalGrade !== score;
  const displayOriginal = isOverridden;

  return (
    <div className="flex-1 flex flex-col bg-background-dark p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8 font-medium">
            <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center">
            <div className={`size-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/30'}`}>
                <CheckCircle size={48} />
            </div>
            
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Evaluation Complete</h1>
            {isOverridden ? (
                <p className="text-purple-400 mb-10 text-lg font-medium flex items-center justify-center gap-2">
                    <AlertTriangle size={20} /> Your final grade was manually reviewed and overridden by your instructor.
                </p>
            ) : (
                <p className="text-slate-400 mb-10 text-lg">Your submission has been automatically graded by the evaluation engine.</p>
            )}
            
            <div className="w-full bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-8">
                    <span className="text-xl font-bold text-slate-300 flex items-center gap-3">
                        Final Grade
                        {isOverridden && <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-900/50 uppercase tracking-wider">Teacher Override</span>}
                    </span>
                    <div className="flex items-center gap-6">
                        {displayOriginal && (
                            <>
                                <div className="flex flex-col items-end opacity-70">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Original</span>
                                  <span className="text-2xl font-bold text-slate-500 line-through decoration-rose-500/50 decoration-2">{originalGrade}</span>
                                </div>
                                <div className="h-10 w-px bg-slate-700"></div>
                            </>
                        )}
                        <span className={`text-5xl font-extrabold ${score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{score} <span className="text-2xl text-slate-500">/ 100</span></span>
                    </div>
                </div>
                
                <div className="space-y-6 text-left">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold text-slate-200 block text-lg">Keyword Extraction (40%)</span>
                            <span className="text-sm text-slate-500 font-medium">{keywordCount} distinct keywords selected</span>
                        </div>
                        <span className="text-xl font-bold text-blue-400">+{Math.min(keywordCount*8, 40)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold text-slate-200 block text-lg">Summary Validation (30%)</span>
                            <span className="text-sm text-slate-500 font-medium">Word count: {wordCount} (Target: 50-200)</span>
                        </div>
                        <span className="text-xl font-bold text-blue-400">+{wordCount >= 50 && wordCount <= 200 ? 30 : (wordCount > 0 ? 15 : 0)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold text-slate-200 block text-lg">Concept Mapping Logic (30%)</span>
                            <span className="text-sm text-slate-500 font-medium">{nodeCount} Nodes placed, Conclusion: {hasConclusion ? 'Yes' : 'No'}</span>
                        </div>
                        <span className="text-xl font-bold text-blue-400">+{Math.min(nodeCount*5, 20) + (hasConclusion ? 10 : 0)} pts</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
