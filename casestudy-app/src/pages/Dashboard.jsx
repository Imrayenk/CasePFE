import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { BookOpen, Clock, FileText, Activity, Users, LayoutGrid, Edit2, History, Trash2, GraduationCap, ThumbsUp, MessageSquare, Send, Library, Plus, Key, Copy, Check, Menu, ChevronDown } from 'lucide-react';

const CaseSocialBar = ({ c }) => {
    const { user, socialData, toggleLike, addComment, deleteComment, avatars } = useStore();
    const [expanded, setExpanded] = useState(false);
    const [cmtText, setCmtText] = useState('');

    const social = socialData[c.id] || { likes: [], comments: [] };
    const likesCount = social.likes.length;
    const commentsCount = social.comments.length;
    const isLiked = social.likes.includes(user?.id);

    const handleLike = (e) => {
        e.stopPropagation();
        if(user) toggleLike(c.id, user.id);
    };

    const submitCmt = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if(!cmtText.trim() || !user) return;
        addComment(c.id, { userId: user.id, userName: user.name, text: cmtText });
        setCmtText('');
    };

    return (
        <div className="pt-3 mt-3 border-t border-slate-800/50 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4">
                <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${isLiked ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
                    {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${expanded ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <MessageSquare size={14} className={expanded ? 'fill-current opacity-50' : ''} />
                    {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
                </button>
            </div>
            {expanded && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-800/50">
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {commentsCount === 0 ? (
                            <p className="text-xs text-slate-500 italic text-center py-2">No comments yet. Be the first!</p>
                        ) : (
                            social.comments.map(cmt => (
                                <div key={cmt.id} className="bg-slate-800/40 p-2 rounded flex gap-2 group relative">
                                    <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                        {avatars?.[cmt.userId] ? <img src={avatars[cmt.userId]} className="w-full h-full object-cover"/> : cmt.userName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-slate-300">{cmt.userName}</span>
                                            <span className="text-[9px] text-slate-500">{new Date(cmt.time).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{cmt.text}</p>
                                    </div>
                                    {user?.id === cmt.userId && (
                                        <button 
                                            type="button"
                                            disabled={!cmt.id.includes('-')}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteComment(c.id, cmt.id); }}
                                            className={`absolute top-2 right-2 transition-opacity p-1 z-10 ${
                                                !cmt.id.includes('-') 
                                                    ? 'text-slate-700 opacity-50 cursor-wait' 
                                                    : 'text-slate-500 hover:text-rose-500 opacity-0 group-hover:opacity-100'
                                            }`}
                                            title={!cmt.id.includes('-') ? "Saving..." : "Delete comment"}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={submitCmt} className="flex items-center gap-2">
                        <input type="text" value={cmtText} onChange={e => setCmtText(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Add a comment..." className="flex-1 bg-slate-800 border border-slate-700 rounded text-xs px-2 py-1.5 focus:border-primary focus:outline-none text-slate-200"/>
                        <button type="submit" disabled={!cmtText.trim()} className="p-1.5 bg-primary text-white rounded disabled:opacity-50 transition-opacity">
                            <Send size={12} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const DeleteModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 text-rose-500">
          <Trash2 size={24} />
          <h3 className="text-xl font-bold">Delete Case</h3>
        </div>
        <p className="text-slate-300 text-sm">
          Are you sure you want to delete this case? This action cannot be undone and will permanently remove all related submissions, comments, and likes.
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Yes, Delete Case"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateSubjectModal = ({ isOpen, onClose }) => {
  const { createSubject } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await createSubject(name, description);
    if (!res.success) {
      alert(res.error || "Failed to create subject");
    } else {
      onClose();
      setName('');
      setDescription('');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-slate-100 mb-4">Create New Subject</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Name</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Advanced Marketing 101" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Brief description of the subject..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-primary focus:outline-none h-24 resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="px-4 py-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50">
              {loading ? "Creating..." : "Create Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EnrollSubjectModal = ({ isOpen, onClose }) => {
  const { enrollSubject } = useStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await enrollSubject(password);
    if (!res.success) {
      alert(res.error || "Failed to enroll");
    } else {
      onClose();
      setPassword('');
      alert("Successfully enrolled!");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 text-primary">
          <Key size={24} />
          <h3 className="text-xl font-bold">Enroll in Subject</h3>
        </div>
        <p className="text-slate-300 text-sm">
          Enter the unique enrollment password provided by your instructor to gain access to their cases.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <input 
              required 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="e.g. A1B2C3D4" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-primary focus:outline-none text-center font-mono tracking-widest uppercase text-lg"
            />
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !password.trim()} className="px-4 py-2 text-sm font-bold bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
              {loading ? "Enrolling..." : "Enroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, submissions, cases, subjects, deleteCase, usersDb, fetchCases, fetchSubmissions, avatars, fetchSocialData, fetchUsersDb, fetchSubjects } = useStore();
  
  const initialView = user?.role === 'teacher' ? 'subjects' : 'cases';
  const [activeView, setActiveView] = useState(() => {
     const stored = localStorage.getItem('dashboardActiveView');
     if (user?.role === 'teacher' && stored === 'cases') return 'subjects';
     return stored || initialView;
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
     return localStorage.getItem('dashboardSelectedSubjectId') || null;
  });
  
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isEnrollSubjectOpen, setIsEnrollSubjectOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [expandedTeachers, setExpandedTeachers] = useState({});

  const confirmDelete = async () => {
      if (!caseToDelete) return;
      setIsDeleting(true);
      const res = await deleteCase(caseToDelete);
      if (res && !res.success) {
          alert(res.error || "Failed to delete case.");
      }
      setIsDeleting(false);
      setCaseToDelete(null);
  };

  useEffect(() => {
    localStorage.setItem('dashboardActiveView', activeView);
  }, [activeView]);

  useEffect(() => {
    // Initial fetch
    fetchCases();
    fetchSubmissions();
    fetchSocialData();
    fetchSubjects();
    
    if (user?.role === 'teacher') {
       fetchUsersDb();
    }
  }, [fetchCases, fetchSubmissions, fetchSocialData, fetchUsersDb, fetchSubjects, user?.role]);

  useEffect(() => {
     if (user?.role === 'teacher' && subjects && subjects.length > 0 && !selectedSubjectId) {
         setSelectedSubjectId(subjects[0].id);
     }
     
     if (selectedSubjectId) {
        localStorage.setItem('dashboardSelectedSubjectId', selectedSubjectId);
        
        if (subjects) {
            const targetSub = subjects.find(s => s.id === selectedSubjectId);
            if (targetSub && targetSub.teacher?.id) {
                setExpandedTeachers(prev => {
                    if (!prev[targetSub.teacher.id]) {
                        return { ...prev, [targetSub.teacher.id]: true };
                    }
                    return prev;
                });
            }
        }
     } else {
        localStorage.removeItem('dashboardSelectedSubjectId');
     }
  }, [subjects, selectedSubjectId, user?.role]);

  const exportCasesCSV = () => {
    if (!cases || cases.length === 0) return;
    const headers = ['ID', 'Title', 'Description', 'Status', 'Date', 'Submissions'];
    const rows = cases.map(c => [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.description.replace(/"/g, '""')}"`,
      c.status,
      c.date,
      submissions?.filter(s => s.caseId === c.id).length || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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

  const copyPassword = (password) => {
      navigator.clipboard.writeText(password);
      setCopiedKey(password);
      setTimeout(() => setCopiedKey(null), 2000);
  };

  const role = user?.role?.toLowerCase() || '';
  if (role === 'admin' || role === 'administrator') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'teacher') {
    return (
      <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-background-dark h-full min-h-0">
        <DeleteModal 
            isOpen={!!caseToDelete} 
            onClose={() => setCaseToDelete(null)} 
            onConfirm={confirmDelete} 
            isDeleting={isDeleting} 
        />
        <CreateSubjectModal 
            isOpen={isCreateSubjectOpen}
            onClose={() => setIsCreateSubjectOpen(false)}
        />
        <div className="w-full max-w-screen-2xl mx-auto space-y-8 mt-6">
          <header className="flex items-start gap-5 border-b border-slate-800 pb-6 rounded-t-xl mt-2 relative">
               {/* Dropdown Menu Toggle */}
               <div className="relative z-50">
                 <button 
                    onClick={() => setIsNavOpen(!isNavOpen)} 
                    className={`p-3 border rounded-xl transition-all flex items-center justify-center h-[56px] w-[56px] shadow-sm ${isNavOpen ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                    aria-label="Toggle Navigation Menu"
                 >
                   <Menu size={24} />
                 </button>
                 {isNavOpen && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setIsNavOpen(false)}></div>
                     <div className="absolute top-full left-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 overflow-hidden flex flex-col shadow-black/50 overflow-y-auto">
                        <div className="px-4 py-2.5 border-b border-slate-800/80 mb-2 bg-slate-900/50">
                           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Dashboard Views</span>
                        </div>
                        <button onClick={() => { setActiveView('subjects'); setIsNavOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3.5 font-bold transition-all ${activeView === 'subjects' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}>
                           <Library size={18} className={activeView === 'subjects' ? "opacity-100" : "opacity-70"}/> My Subjects
                        </button>
                        <button onClick={() => { setActiveView('submissions'); setIsNavOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3.5 font-bold transition-all ${activeView === 'submissions' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}>
                           <Users size={18} className={activeView === 'submissions' ? "opacity-100" : "opacity-70"}/> Grading Queue
                        </button>
                        <button onClick={() => { setActiveView('learners'); setIsNavOpen(false); }} className={`w-full flex items-center gap-3 px-5 py-3.5 font-bold transition-all ${activeView === 'learners' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}>
                           <GraduationCap size={18} className={activeView === 'learners' ? "opacity-100" : "opacity-70"}/> Learners Directory
                        </button>
                     </div>
                   </>
                 )}
               </div>
               <div className="flex flex-col gap-1.5 justify-center py-1">
                 <h1 className="text-3xl font-black text-slate-100 tracking-tight">Teacher Dashboard</h1>
                 <p className="text-slate-400 font-medium text-sm">Manage subjects, case studies, and review student submissions.</p>
               </div>
          </header>

          {activeView === 'subjects' && (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 mt-4 min-h-[600px] items-stretch pb-8">
              {(!subjects || subjects.length === 0) ? (
                 <div className="w-full flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mt-2 text-center h-[500px]">
                    <div className="size-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                      <Library size={32} className="text-slate-500 opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No Subjects Yet</h3>
                    <p className="text-slate-400 max-w-md mb-6">Create a subject to serve as a container for your cases and generate an enrollment password.</p>
                    <button 
                      onClick={() => setIsCreateSubjectOpen(true)}
                      className="px-4 py-2 bg-primary rounded-lg text-white font-bold shadow-md hover:bg-primary/90 flex items-center gap-2"
                    >
                      <Plus size={16}/> Create Subject
                    </button>
                 </div>
              ) : (
                <>
                  {/* Left Sidebar - Subjects */}
                  <div className="w-full lg:w-64 shrink-0 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-6 pb-6 lg:pb-0">
                     <h2 className="text-2xl font-bold text-slate-100 hidden lg:block">Subjects</h2>
                     <button onClick={() => setIsCreateSubjectOpen(true)} className="w-full py-2.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                       <Plus size={18}/> New Subject
                     </button>
                     <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible hide-scrollbar snap-x">
                        {subjects.map(sub => (
                           <button 
                              key={sub.id} 
                              onClick={() => setSelectedSubjectId(sub.id)}
                              className={`shrink-0 lg:shrink w-[200px] lg:w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all snap-center ${selectedSubjectId === sub.id ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700'}`}
                           >
                              {sub.name}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Main Middle Pane - Cases */}
                  <div className="flex-1 flex flex-col min-w-0 lg:pr-6 lg:border-r border-slate-800">
                     {selectedSubjectId ? (() => {
                        const sub = subjects.find(s => s.id === selectedSubjectId);
                        if (!sub) return null;
                        const subjectCases = cases?.filter(c => c.subjectId === sub.id) || [];
                        return (
                           <div className="flex flex-col h-full bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800/80 pb-6">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                       <h1 className="text-3xl font-black text-slate-100">{sub.name}</h1>
                                       <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/80 group">
                                           <Key size={14} className="text-primary opacity-80"/>
                                           <span className="font-mono text-sm tracking-widest text-slate-300 uppercase">{sub.enrollmentPassword}</span>
                                           <button 
                                               onClick={() => copyPassword(sub.enrollmentPassword)}
                                               className="text-slate-500 hover:text-primary transition-colors ml-1 p-0.5 rounded hover:bg-slate-700"
                                               title="Copy Password"
                                           >
                                               {copiedKey === sub.enrollmentPassword ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                                           </button>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-6 mt-4">
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><BookOpen size={12}/> Cases</span>
                                          <span className="text-sm font-semibold text-slate-300 mt-0.5">{subjectCases.length} Assigned</span>
                                       </div>
                                       <div className="w-px h-8 bg-slate-800"></div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><GraduationCap size={12}/> Students</span>
                                          <span className="text-sm font-semibold text-blue-400 mt-0.5">{sub.enrolledStudents?.length || 0} Enrolled</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={() => navigate('/create-case')}
                                   className="px-4 py-2 bg-primary rounded-lg text-white font-bold shadow hover:bg-primary/90 flex items-center gap-2 whitespace-nowrap shrink-0 transition-transform active:scale-95"
                                 >
                                   <BookOpen size={16}/> Create Case
                                 </button>
                              </div>

                              <div className="mt-6 flex-1">
                                 {subjectCases.length === 0 ? (
                                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800/50 rounded-xl border-dashed">
                                       <BookOpen size={32} className="text-slate-600 mb-3" />
                                       <p className="text-slate-400 font-medium">No cases assigned to this subject yet.</p>
                                    </div>
                                 ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                       {subjectCases.map(c => (
                                          <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg transition-all cursor-pointer group flex flex-col min-h-[160px]" onClick={() => navigate(`/edit-case/${c.id}`)}>
                                             <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-1 pr-4">{c.title}</h3>
                                                <button 
                                                   onClick={(e) => { e.stopPropagation(); setCaseToDelete(c.id); }}
                                                   className="text-slate-600 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded z-10"
                                                >
                                                   <Trash2 size={14}/>
                                                </button>
                                             </div>
                                             <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-1">{c.description}</p>
                                             <div className="flex items-center justify-between pt-3 border-t border-slate-800/50 mt-auto">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.status === 'Active' ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-900/30' : 'bg-slate-800 text-slate-400'}`}>
                                                   {c.status}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-500">Updated {c.updateHistory?.length > 0 ? new Date(c.updateHistory[c.updateHistory.length - 1]).toLocaleDateString() : c.date}</span>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })() : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium h-full bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                           Select a subject to view its content
                        </div>
                     )}
                  </div>

                  {/* Right Sidebar - Enrolled Students */}
                  {selectedSubjectId && (() => {
                     const sub = subjects.find(s => s.id === selectedSubjectId);
                     if (!sub) return null;
                     const subjectCases = cases?.filter(c => c.subjectId === sub.id) || [];
                     const studentIds = sub.enrolledStudents?.map(s => s.id) || [];
                     const detailedStudents = usersDb.filter(u => studentIds.includes(u.id));
                     
                     return (
                        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                           <h2 className="text-xl font-bold text-slate-200 lg:pl-2">Enrolled Students <span className="opacity-50 font-normal">in {sub.name}</span></h2>
                           <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[500px] lg:max-h-[700px]">
                              {detailedStudents.length === 0 ? (
                                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                                    <Users size={32} className="opacity-30 mb-3" />
                                    <p className="text-sm font-medium">No students enrolled yet.</p>
                                 </div>
                              ) : (
                                 <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                                    {detailedStudents.map(student => {
                                       const subForStudent = submissions?.filter(s => s.learnerName === student.name && subjectCases.some(sc => sc.id === s.caseId));
                                       const completed = subForStudent.filter(s => s.status.includes('Graded') || s.status === 'Submitted for Review').length;
                                       
                                       return (
                                          <button 
                                              key={student.id} 
                                              onClick={() => navigate(`/student-stats/${student.id}/${sub.id}`)}
                                              className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/80 transition-all border border-transparent hover:border-primary/30 group"
                                          >
                                             <div className="size-10 rounded-full bg-slate-800/80 group-hover:bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-primary/50 overflow-hidden transition-all">
                                                {avatars?.[student.id] ? <img src={avatars[student.id]} className="w-full h-full object-cover"/> : <Users size={16}/>}
                                             </div>
                                             <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-sm font-bold text-slate-200 truncate group-hover:text-primary transition-colors">{student.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate">{student.id.substring(0,8)}</span>
                                                <span className="text-[10px] text-slate-500 truncate mt-0.5" title={student.email}>
                                                   {completed} / {subjectCases.length} cases completed
                                                </span>
                                             </div>
                                          </button>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                        </div>
                     );
                  })()}
                </>
              )}
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
                          <th className="px-6 py-4 whitespace-nowrap">Subject</th>
                          <th className="px-6 py-4 whitespace-nowrap">Date</th>
                          <th className="px-6 py-4 whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 whitespace-nowrap">Score</th>
                          <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {submissions.filter(sub => sub.status !== 'In Progress').map(sub => {
                          const assocCase = cases?.find(c => c.id === sub.caseId);
                          const assocSub = subjects?.find(s => s.id === assocCase?.subjectId);
                          return (
                          <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-200">{sub.learnerName}</td>
                            <td className="px-6 py-4 text-slate-400 font-medium text-sm" title={assocCase?.title || sub.caseId}>{assocCase?.title ? (assocCase.title.length > 20 ? assocCase.title.slice(0, 20)+'...' : assocCase.title) : 'Unknown'}</td>
                            <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">{assocSub?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">{sub.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  {sub.status.includes('Graded') 
                                    ? <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-900/50">{sub.status}</span>
                                    : <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-900/50">{sub.status}</span>
                                  }
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-200">{sub.score ?? 'Pending'}{sub.score !== null && sub.score !== undefined ? ' / 100' : ''}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                  onClick={() => navigate(`/grading/${sub.id}`)}
                                  className="text-primary hover:text-white text-sm font-semibold transition-colors bg-primary/10 hover:bg-primary px-3 py-1.5 rounded"
                              >
                                  Review
                              </button>
                            </td>
                          </tr>
                        )})}
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
                <span className="text-sm font-bold text-slate-500 bg-slate-800 px-3 py-1 rounded-lg">{usersDb.filter(u => u.role === 'learner').length} Total</span>
              </div>
              <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/30 text-xs uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                        <th className="px-6 py-4 whitespace-nowrap">Name</th>
                        <th className="px-6 py-4 whitespace-nowrap">Email</th>
                        <th className="px-6 py-4 whitespace-nowrap">Enrolled Subjects</th>
                        <th className="px-6 py-4 whitespace-nowrap text-right">Total Submissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {usersDb.filter(u => u.role === 'learner').map(learner => {
                        const subCount = submissions.filter(s => s.learnerName === learner.name).length;
                        // Determine which subjects they are in
                        const learnerSubjects = subjects?.filter(s => s.enrolledStudents?.some(es => es.id === learner.id)) || [];

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
                              <div className="flex flex-wrap gap-1">
                                  {learnerSubjects.length > 0 ? learnerSubjects.map(ls => (
                                      <span key={ls.id} className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{ls.name}</span>
                                  )) : <span className="text-xs text-slate-500 italic">None</span>}
                              </div>
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

  // ==== Learner View ====
  const subjectsByTeacher = (subjects || []).reduce((acc, sub) => {
      const tId = sub.teacher?.id || 'unknown';
      if (!acc[tId]) {
          acc[tId] = {
              teacher: sub.teacher || { name: 'Unknown Instructor' },
              subjects: []
          };
      }
      acc[tId].subjects.push(sub);
      return acc;
  }, {});
  
  const teacherGroups = Object.values(subjectsByTeacher);

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-background-dark h-full min-h-0">
        <EnrollSubjectModal 
            isOpen={isEnrollSubjectOpen}
            onClose={() => setIsEnrollSubjectOpen(false)}
        />
      <div className="w-full max-w-screen-2xl mx-auto space-y-8 mt-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-6 mt-2 relative">
             <div className="flex flex-col gap-1.5 justify-center py-1">
               <h1 className="text-3xl font-black text-slate-100 tracking-tight">Learner Dashboard</h1>
               <p className="text-slate-400 font-medium text-sm">Select an assigned case study to begin or review your evaluation.</p>
             </div>
             <div className="flex w-full sm:w-auto">
               <button 
                 onClick={() => setIsEnrollSubjectOpen(true)}
                 className="px-6 py-2.5 bg-primary/10 border border-primary/20 hover:border-primary/50 text-primary hover:text-white hover:bg-primary rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-3 w-full sm:w-auto h-[56px]"
               >
                 <Key size={18}/> Enroll in Subject
               </button>
             </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 mt-4 min-h-[600px] items-stretch pb-8">
             {teacherGroups.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-16 bg-slate-900/50 border border-slate-800/50 border-dashed rounded-xl mt-2 text-center h-[500px]">
                  <div className="size-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                    <Key size={40} className="text-slate-500 opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-3">No Enrolled Subjects</h3>
                  <p className="text-slate-400 max-w-lg mb-6">You aren't enrolled in any subjects yet. Click the "Enroll in Subject" button and enter the password provided by your instructor to access cases.</p>
                </div>
             ) : (
                <>
                  {/* Left Sidebar - Subjects grouped by Teacher */}
                  <div className="w-full lg:w-64 shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-6 pb-6 lg:pb-0 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-1 pb-4 mb-6 border-b border-slate-800/80">
                        <h2 className="text-xl font-black text-slate-200">Enrolled Instructors</h2>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                            {teacherGroups.length} connected instructor{teacherGroups.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex flex-col gap-6">
                        {teacherGroups.map(group => {
                        const tId = group.teacher.id || 'unknown';
                        const isExpanded = !!expandedTeachers[tId];
                        return (
                        <div key={tId} className="flex flex-col gap-2 relative">
                            <button 
                                onClick={() => setExpandedTeachers(p => ({...p, [tId]: !p[tId]}))}
                                className="flex items-center justify-between gap-2 p-2 hover:bg-slate-800/50 rounded-lg group transition-colors w-full border border-transparent hover:border-slate-800"
                            >
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-primary"/>
                                    <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{group.teacher.name}</span>
                                </div>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                            </button>
                            {isExpanded && (
                                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible hide-scrollbar snap-x">
                                    {group.subjects.map(sub => (
                                        <button 
                                          key={sub.id}
                                          onClick={() => setSelectedSubjectId(sub.id)}
                                          className={`shrink-0 lg:shrink w-[200px] lg:w-full text-left px-4 py-3 rounded-xl font-bold transition-all snap-center flex items-center gap-3 ${selectedSubjectId === sub.id ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700'}`}
                                        >
                                            <Library size={16} className={selectedSubjectId === sub.id ? 'text-primary' : 'text-slate-500'}/>
                                            <span className="truncate flex-1">{sub.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )})}
                    </div>
                  </div>

                  {/* Main Middle Pane - Cases */}
                  <div className="flex-1 flex flex-col min-w-0">
                     {selectedSubjectId ? (() => {
                        const sub = subjects.find(s => s.id === selectedSubjectId);
                        if (!sub) return null;
                        const subjectCases = sub.cases || [];
                        return (
                            <div className="flex flex-col h-full bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800/50 shadow-xl">
                               <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
                                   <div className="flex flex-col gap-2">
                                       <span className="text-xs font-bold text-primary uppercase tracking-widest">{sub.teacher?.name || 'Unknown Instructor'}</span>
                                       <h3 className="text-3xl font-black text-slate-200">{sub.name}</h3>
                                   </div>
                                   <span className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-400 border border-slate-700">
                                       {subjectCases.length} Assigned Cases
                                   </span>
                               </div>

                               {subjectCases.length === 0 ? (
                                   <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800/50 border-dashed rounded-xl">
                                       <BookOpen size={32} className="text-slate-600 mb-3" />
                                       <p className="text-slate-500 font-medium text-center">No cases active for this subject yet.</p>
                                   </div>
                               ) : (
                                   <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                       {subjectCases.map(c => {
                                             const userSub = submissions?.find(s => s.caseId === c.id);
                                             const isSubmittedForReview = userSub?.status === 'Submitted for Review';
                                             const isGraded = userSub?.status?.includes('Graded');
                                             const isInProgress = userSub?.status === 'In Progress';
                                             const isCompleteOrSubmitted = isSubmittedForReview || isGraded;

                                             return (
                                              <div 
                                                key={c.id} 
                                                className={`bg-slate-900 border-2 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 shadow-lg cursor-pointer flex flex-col h-full hover:-translate-y-1 ${isCompleteOrSubmitted ? 'opacity-80 border-slate-800' : 'border-slate-800/80 hover:shadow-primary/10'}`}
                                                onClick={() => navigate(isCompleteOrSubmitted ? `/results/${c.id}` : `/workspace/${c.id}`)}
                                              >
                                                <div className="flex items-start justify-between mb-4">
                                                  <div className="flex items-center gap-1">
                                                      {isGraded ? (
                                                        <>
                                                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-900/30 text-emerald-500 border border-emerald-900/50 uppercase tracking-wider flex items-center gap-1"><Check size={10}/> Completed</span>
                                                          {userSub.status === 'Graded (Override)' && userSub.overrideHistory?.length > 0 && userSub.overrideHistory[0].oldScore !== userSub.score && (
                                                             <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-900/50 uppercase tracking-wider" title="Grade naturally overriden by instructor">Override</span>
                                                          )}
                                                        </>
                                                      ) : isSubmittedForReview ? (
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-900/30 text-amber-400 border border-amber-900/50 uppercase tracking-wider">Submitted for Review</span>
                                                      ) : isInProgress ? (
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-900/30 text-blue-400 border border-blue-900/50 uppercase tracking-wider">In Progress</span>
                                                      ) : (
                                                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">Required</span>
                                                      )}
                                                  </div>
                                                  {isCompleteOrSubmitted ? <FileText size={20} className={isGraded ? 'text-emerald-500' : 'text-amber-400'}/> : <BookOpen size={20} className="text-primary"/>}
                                                </div>
                                                <h3 className={`text-xl font-bold mb-2 leading-tight ${isCompleteOrSubmitted ? 'text-slate-400' : 'text-slate-100'}`}>{c.title}</h3>
                                                <p className={`text-sm mb-6 flex-1 line-clamp-3 ${isCompleteOrSubmitted ? 'text-slate-500' : 'text-slate-400'}`}>
                                                  {c.description}
                                                </p>
                                                
                                                {!isCompleteOrSubmitted && (
                                                  <div className="pt-4 border-t border-slate-800 mt-auto flex items-center justify-between">
                                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        <Clock size={12}/> Published {new Date(c.createdAt).toLocaleDateString()}
                                                      </span>
                                                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                                                          Start <Activity size={10}/>
                                                       </span>
                                                  </div>
                                                )}
                                                {isCompleteOrSubmitted && (
                                                  <div className="mt-auto pt-4 border-t border-slate-800/50">
                                                    <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-semibold group-hover:bg-slate-700 transition-colors">
                                                      {isSubmittedForReview ? 'View Review Status' : 'View Results'}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                             );
                                         })}
                                     </section>
                                 )}
                            </div>
                        );
                     })() : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 font-medium h-full bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed min-h-[300px]">
                           Select a subject from the sidebar to view cases
                        </div>
                     )}
                  </div>
                </>
             )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
