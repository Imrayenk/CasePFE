import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, CheckCircle, FileText, History, Network, Save } from 'lucide-react';
import { apiGet } from '../lib/api';
import { guidedStepConfig } from '../lib/guidedCase';
import ReadOnlyConceptMapper from '../components/ReadOnlyConceptMapper';

const renderGuidedValue = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-slate-500 italic">No entries provided.</p>;
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return value
    ? <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>
    : <p className="text-slate-500 italic">No response provided.</p>;
};

const GradingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, submissions, updateSubmissionScore, fetchSubmissions, fetchCases } = useStore();
  
  const submission = submissions.find(s => s.id === id);
  const [overrideScore, setOverrideScore] = useState(submission?.score ?? '');
  const [teacherFeedback, setTeacherFeedback] = useState(submission?.teacherFeedback || '');
  const [saveStatus, setSaveStatus] = useState({ status: 'idle', message: '' });
  const [details, setDetails] = useState({
      guidedDraft: null,
      draft_nodes: [],
      draft_edges: [],
      isLoading: true,
      error: null
  });
  
  const caseObj = submission ? cases.find(c => c.id === submission.caseId) : null;
  const caseTitle = caseObj ? caseObj.title : 'Unknown Case';

  useEffect(() => {
    if (submissions.length === 0) fetchSubmissions();
    if (cases.length === 0) fetchCases();
  }, [submissions.length, cases.length, fetchSubmissions, fetchCases]);

  useEffect(() => {
    if (submission) {
        setOverrideScore(submission.score ?? '');
        setTeacherFeedback(submission.teacherFeedback || '');
    }
  }, [submission]);

  useEffect(() => {
    const fetchDetails = async () => {
        setDetails(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const data = await apiGet(`/submissions/details/${id}`);

            setDetails({
                guidedDraft: data.guidedDraft,
                draft_nodes: data.draft_nodes || [],
                draft_edges: data.draft_edges || [],
                isLoading: false,
                error: null
            });
            setTeacherFeedback(data.teacher_feedback || '');
        } catch (error) {
            console.error('Failed to load submission details:', error);
            setDetails(prev => ({ ...prev, isLoading: false, error: error.message }));
        }
    };

    if (id) fetchDetails();
  }, [id]);

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
    const result = await updateSubmissionScore(id, parseInt(overrideScore, 10), teacherFeedback);
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Review Status</span>
                <span className={`text-lg font-bold ${submission.status.includes('Graded') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {submission.status}
                </span>
             </div>
             <div className="h-10 w-px bg-slate-700 mx-2"></div>
             <label className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Grade</span>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore} 
                  onChange={(e) => setOverrideScore(e.target.value)} 
                  className="bg-slate-800 border-none outline-none focus:ring-1 focus:ring-primary rounded py-1 px-2 text-white font-bold w-20 text-center"
                />
             </label>
             <button onClick={handleOverride} disabled={saveStatus.status === 'saving' || overrideScore === ''} className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap disabled:opacity-50">
               {saveStatus.status === 'saving' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <Save size={16}/>} 
               {saveStatus.status === 'saving' ? 'Saving...' : 'Save Review'}
             </button>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 flex flex-col gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 mb-5 flex items-center gap-2">
                  <FileText className="text-indigo-400" size={18}/> Guided Response
                </h3>

                {details.isLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <span className="material-symbols-outlined animate-spin text-slate-500 text-3xl">sync</span>
                  </div>
                ) : details.error ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                    Error loading response: {details.error}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {guidedStepConfig.map((step) => (
                      <section key={step.key} className="rounded-xl border border-slate-800 bg-slate-800/20 p-5">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">{step.title}</h4>
                        {renderGuidedValue(details.guidedDraft?.[step.key])}
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-1 flex flex-col gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={18}/> Teacher Feedback
                </h3>
                <textarea
                  value={teacherFeedback}
                  onChange={(event) => setTeacherFeedback(event.target.value)}
                  rows={8}
                  placeholder="Write feedback for the learner..."
                  className="w-full resize-none rounded-lg bg-slate-800 border border-slate-700 p-4 text-slate-100 focus:outline-none focus:border-primary custom-scrollbar"
                />
                {saveStatus.status === 'success' && <p className="text-sm font-bold text-emerald-400">Review saved.</p>}
                {saveStatus.status === 'error' && <p className="text-sm font-bold text-rose-400">{saveStatus.message || 'Update failed.'}</p>}
              </div>

              {submission?.overrideHistory?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <History className="text-purple-400" size={18}/> Grade History
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
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2"><Network className="text-sky-400" size={18}/> Concept Map</span>
            {!details.isLoading && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{details.draft_nodes.length} Nodes</span>}
          </h3>
          <div className="h-[560px] bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
            {details.isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-slate-500 text-3xl">sync</span>
              </div>
            ) : details.error ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-rose-400 text-sm">{details.error}</div>
            ) : details.draft_nodes.length > 0 ? (
              <ReadOnlyConceptMapper nodes={details.draft_nodes} edges={details.draft_edges} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                <Network size={32} className="opacity-20"/>
                <p className="text-sm">No concept map was submitted.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GradingView;
