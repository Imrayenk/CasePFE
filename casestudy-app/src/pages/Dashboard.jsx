import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { BookOpen, Clock, FileText, Activity, Users, LayoutGrid, Edit2, History, Trash2, GraduationCap } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentCase, user, submissions, cases, deleteCase, usersDb, fetchCases, fetchSubmissions, avatars } = useStore();
  const [activeView, setActiveView] = useState(() => localStorage.getItem('dashboardActiveView') || 'cases');

  useEffect(() => {
    localStorage.setItem('dashboardActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    fetchCases();
    fetchSubmissions();
  }, [fetchCases, fetchSubmissions]);

  const exportCasesCSV = () => {
    if (!cases || cases.length === 0) return;
    
    // Define headers
    const headers = ['ID', 'Title', 'Description', 'Status', 'Date', 'Submissions'];
    
    // Map data
    const rows = cases.map(c => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      c.status,
      c.date,
      submissions?.filter(s => s.caseId === c.id).length || 0
    ]);
    
    // Combine to string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cases_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user.role === 'teacher') {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-background-dark">
        <div className="max-w-6xl mx-auto space-y-8 mt-6">
          <header className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-slate-100">Teacher Dashboard</h1>
              <p className="text-slate-400">Manage case studies and review student submissions.</p>
            </div>
            <button 
              onClick={() => navigate('/create-case')}
              className="px-4 py-2 bg-primary rounded-lg text-white font-bold shadow-md hover:bg-primary/90 flex items-center gap-2"
            >
              <BookOpen size={16}/> Create New Case
            </button>
          </header>

          <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
            <button 
              onClick={() => setActiveView('cases')}
              className={`flex items-center gap-2 pb-2 px-1 border-b-2 transition-colors font-bold ${activeView === 'cases' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              <LayoutGrid size={18}/> Published Cases
            </button>
            <button 
              onClick={() => setActiveView('submissions')}
              className={`flex items-center gap-2 pb-2 px-1 border-b-2 transition-colors font-bold ${activeView === 'submissions' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              <Users size={18}/> Learner Submissions
            </button>
            <button 
              onClick={() => setActiveView('learners')}
              className={`flex items-center gap-2 pb-2 px-1 border-b-2 transition-colors font-bold ${activeView === 'learners' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              <GraduationCap size={18}/> Learners
            </button>
          </div>

          {activeView === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-bold text-slate-200">Active Library</h2>
                {cases && cases.length > 0 && (
                  <button 
                    onClick={exportCasesCSV}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                  >
                    <FileText size={14}/> Export CSV
                  </button>
                )}
              </div>
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {cases && cases.map((c) => {
                  const subCount = submissions?.filter(s => s.caseId === c.id).length || 0;
                  return (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-primary/50 transition-colors shadow-lg flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'Active' ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-900/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {c.status}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Case #{c.id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/edit-case/${c.id}`); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-800 rounded transition-colors group"
                          title="Edit Case"
                        >
                           <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
                                 deleteCase(c.id);
                             }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors group z-10"
                          title="Delete Case"
                        >
                           <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">{c.title}</h3>
                    <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-3">
                      {c.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 mt-auto">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12}/> {c.updateHistory && c.updateHistory.length > 0 ? 'Last Edited' : 'Published'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">
                            {c.updateHistory && c.updateHistory.length > 0 
                               ? new Date(c.updateHistory[c.updateHistory.length - 1]).toLocaleDateString() 
                               : c.date}
                          </span>
                          {c.updateHistory && c.updateHistory.length > 0 && (
                            <div className="group relative z-10">
                              <History size={14} className="text-primary cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-xs text-slate-300 p-3 rounded shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="font-bold text-white mb-2 border-b border-slate-700 pb-1">Update History</div>
                                <ul className="space-y-1.5 list-disc pl-3">
                                  <li className="text-slate-400">Published: {c.date}</li>
                                  {c.updateHistory.map((d, i) => (
                                    <li key={i}>
                                      Update #{i + 1}: <span className="text-slate-300">{new Date(d).toLocaleDateString()}</span> at {new Date(d).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Activity size={12}/> Submissions</span>
                        <span className="text-sm font-medium text-blue-400">{subCount}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </section>
            </div>
          )}

          {activeView === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-bold text-slate-200">Recent Grading Queue</h2>
              </div>
              <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="font-bold text-slate-200 text-lg">Submissions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800/30 text-xs uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                          <th className="px-6 py-4 whitespace-nowrap">Student</th>
                          <th className="px-6 py-4 whitespace-nowrap">Case ID</th>
                          <th className="px-6 py-4 whitespace-nowrap">Date</th>
                          <th className="px-6 py-4 whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 whitespace-nowrap">Score</th>
                          <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {submissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-200">{sub.learnerName}</td>
                            <td className="px-6 py-4 text-slate-400 font-medium text-sm">{sub.caseId}</td>
                            <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">{sub.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  {sub.status.includes('Graded') 
                                    ? <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">{sub.status}</span>
                                    : <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-900/50">{sub.status}</span>
                                  }
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-200">{sub.score} / 100</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                  onClick={() => navigate(`/grading/${sub.id}`)}
                                  className="text-primary hover:text-white text-sm font-semibold transition-colors bg-primary/10 hover:bg-primary px-3 py-1.5 rounded"
                              >
                                  Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeView === 'learners' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mt-4">
                <h2 className="text-xl font-bold text-slate-200">Learners Directory</h2>
                <span className="text-sm font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">{usersDb.filter(u => u.role === 'learner').length} Enrolled</span>
              </div>
              <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/30 text-xs uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                        <th className="px-6 py-4 whitespace-nowrap">Name</th>
                        <th className="px-6 py-4 whitespace-nowrap">Email</th>
                        <th className="px-6 py-4 whitespace-nowrap">Account ID</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Total Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersDb.filter(u => u.role === 'learner').map(learner => {
                        const subCount = submissions.filter(s => s.learnerName === learner.name).length;
                        return (
                          <tr key={learner.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden border border-primary/20">
                                  {avatars?.[learner.id] ? (
                                      <img src={avatars[learner.id]} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                      learner.name?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <span className="font-semibold text-slate-200">{learner.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-sm">{learner.email}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{learner.id}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`text-sm font-bold ${subCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{subCount}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {usersDb.filter(u => u.role === 'learner').length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <GraduationCap size={40} className="mx-auto mb-3 opacity-30"/>
                      <p className="font-bold">No learners registered yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background-dark">
      <div className="max-w-6xl mx-auto space-y-8 mt-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-100">Learner Dashboard</h1>
          <p className="text-slate-400">Select an assigned case study to begin your evaluation.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases && cases.filter(c => c.status === 'Active').map(c => {
             const userSub = submissions?.find(s => s.caseId === c.id && s.learnerName === user?.name && (s.status === 'Submitted' || s.status.includes('Graded')));
             const isCompleted = !!userSub;
             
             return (
              <div 
                key={c.id} 
                className={`bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-primary/50 transition-colors shadow-lg cursor-pointer flex flex-col h-full ${isCompleted ? 'opacity-70' : ''}`}
                onClick={() => navigate(isCompleted ? `/results/${c.id}` : `/workspace/${c.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {isCompleted ? (
                        <>
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-900/30 text-emerald-500 border border-emerald-900/50 uppercase tracking-wider">Completed</span>
                          {userSub.status === 'Graded (Override)' && userSub.overrideHistory?.length > 0 && userSub.overrideHistory[0].oldScore !== userSub.score && (
                             <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-900/50 uppercase tracking-wider" title="Grade naturally overriden by instructor">Override</span>
                          )}
                        </>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-900/30 text-amber-500 border border-amber-900/50 uppercase tracking-wider">Required</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 ml-1">Case #{c.id}</span>
                  </div>
                  {isCompleted ? <FileText size={18} className="text-emerald-500"/> : <BookOpen size={18} className="text-primary"/>}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isCompleted ? 'text-slate-400' : 'text-slate-200'}`}>{c.title}</h3>
                <p className={`text-sm mb-6 flex-1 line-clamp-3 ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                  {c.description}
                </p>
                
                {!isCompleted && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 mt-auto">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12}/> {c.updateHistory && c.updateHistory.length > 0 ? 'Last Edited' : 'Published'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">
                            {c.updateHistory && c.updateHistory.length > 0 
                               ? new Date(c.updateHistory[c.updateHistory.length - 1]).toLocaleDateString() 
                               : c.date}
                          </span>
                          {c.updateHistory && c.updateHistory.length > 0 && (
                            <div className="group relative z-10">
                              <History size={14} className="text-primary cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-800 text-xs text-slate-300 p-3 rounded shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="font-bold text-white mb-2 border-b border-slate-700 pb-1">Update History</div>
                                <ul className="space-y-1.5 list-disc pl-3">
                                  <li className="text-slate-400">Published: {c.date}</li>
                                  {c.updateHistory.map((d, i) => (
                                    <li key={i}>
                                      Update #{i + 1}: <span className="text-slate-300">{new Date(d).toLocaleDateString()}</span> at {new Date(d).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                     <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Activity size={12}/> Status</span>
                       <span className="text-sm font-medium text-blue-400">In Progress</span>
                     </div>
                  </div>
                )}
                {isCompleted && (
                  <div className="mt-auto pt-4 border-t border-slate-800/50">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700">
                      View Results
                    </button>
                  </div>
                )}
              </div>
             );
          })}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
