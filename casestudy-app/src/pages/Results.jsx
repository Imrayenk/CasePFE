import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, MessageSquare } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { submissionResult, submissions, fetchSubmissions } = useStore();

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const existingSub = id ? submissions.find(s => s.caseId === id) : null;
  const activeResult = existingSub || submissionResult;

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

  const isPending = activeResult.status === 'Submitted for Review' || activeResult.status === 'submitted';
  const isGraded = activeResult.status?.includes?.('Graded') || activeResult.status === 'graded' || activeResult.status === 'graded_override';
  const score = activeResult.score;
  const feedback = activeResult.teacherFeedback || '';

  return (
    <div className="flex-1 flex flex-col bg-background-dark p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8 font-medium">
            <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center">
            <div className={`size-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${
              isPending
                ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30'
            }`}>
                {isPending ? <Clock size={48} /> : <CheckCircle size={48} />}
            </div>
            
            <h1 className="text-4xl font-bold text-slate-100 mb-2">
              {isPending ? 'Submitted for Review' : 'Review Complete'}
            </h1>
            <p className="text-slate-400 mb-10 text-lg">
              {isPending
                ? 'Your guided case solution has been sent to your instructor. Your grade will appear here after review.'
                : 'Your instructor has reviewed your guided case solution.'}
            </p>
            
            <div className="w-full bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-8">
                    <span className="text-xl font-bold text-slate-300">Status</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                      isPending
                        ? 'bg-amber-900/30 text-amber-400 border-amber-900/50'
                        : 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50'
                    }`}>
                      {activeResult.status}
                    </span>
                </div>

                {isGraded && (
                  <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-8">
                    <span className="text-xl font-bold text-slate-300">Final Grade</span>
                    <span className={`text-5xl font-extrabold ${(score ?? 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {score ?? '--'} <span className="text-2xl text-slate-500">/ 100</span>
                    </span>
                  </div>
                )}

                <div className="text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-slate-200">Teacher Feedback</h2>
                  </div>
                  <div className="rounded-xl bg-slate-900/70 border border-slate-700 p-5 min-h-28">
                    {feedback ? (
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{feedback}</p>
                    ) : (
                      <p className="text-slate-500 italic">
                        {isPending ? 'Feedback will appear after your instructor reviews the submission.' : 'No written feedback was provided.'}
                      </p>
                    )}
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
