import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, Users, BookOpen, ChevronRight, Calculator, FileText, CheckCircle2, Clock } from 'lucide-react';

const StudentStats = () => {
    const { studentId, subjectId } = useParams();
    const navigate = useNavigate();
    const { subjects, cases, submissions, usersDb, fetchSubmissions, avatars, user } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            fetchSubmissions(studentId).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [studentId, fetchSubmissions]);

    // Derived State
    const subject = subjects?.find(s => s.id === subjectId);
    const student = usersDb?.find(u => u.id === studentId) || subject?.enrolledStudents?.find(u => u.id === studentId);
    const subjectCases = cases?.filter(c => c.subjectId === subjectId) || [];
    
    const studentSubmissions = useMemo(() => {
        if (!submissions || !subjectCases.length) return [];
        return submissions.filter(s => 
            s.learnerId === studentId && 
            subjectCases.some(c => c.id === s.caseId)
        );
    }, [submissions, studentId, subjectCases]);

    const stats = useMemo(() => {
        let completed = 0;
        let totalScore = 0;
        let gradedCount = 0;
        let totalWords = 0;

        studentSubmissions.forEach(sub => {
            const statusLower = sub.status.toLowerCase();
            if (statusLower.includes('graded') || statusLower.includes('submitted')) {
                completed++;
            }
            if (typeof sub.score === 'number') {
                totalScore += sub.score;
                gradedCount++;
            }
            if (sub.wordCount) {
                totalWords += sub.wordCount;
            } else if (sub.summary_text) {
                totalWords += sub.summary_text.split(/\s+/).length;
            }
        });

        const avgGrade = gradedCount > 0 ? Math.round(totalScore / gradedCount) : null;
        
        return {
            completed,
            total: subjectCases.length,
            avgGrade,
            totalWords,
            gradedCount
        };
    }, [studentSubmissions, subjectCases]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!subject || !student) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px]">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">Record Not Found</h2>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto w-full pb-12 mt-6 px-4 xl:px-0">
            {/* Header / Breadcrumb */}
            <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold mb-8 w-fit"
            >
                <ArrowLeft size={18}/> Back to Dashboard
            </button>

            {/* Profile Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-xl">
                <div className="size-32 rounded-full bg-slate-800 border-4 border-slate-700/50 flex items-center justify-center overflow-hidden shrink-0">
                    {avatars?.[studentId] ? (
                        <img src={avatars[studentId]} alt={student.name} className="w-full h-full object-cover"/>
                    ) : (
                        <Users size={48} className="text-primary"/>
                    )}
                </div>
                <div className="flex flex-col items-center md:items-start flex-1 min-w-0 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-100 mb-2 truncate w-full">{student.name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-400 font-medium font-mono text-sm mb-4">
                        <span className="bg-slate-800 px-3 py-1 rounded-md text-slate-300 border border-slate-700">{student.id.substring(0,8)}</span>
                        <span>{student.email}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg font-bold mt-auto">
                        <BookOpen size={18}/>
                        Enrolled in {subject.name}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="flex gap-4 md:w-auto w-full overflow-x-auto pb-2 md:pb-0 hide-scrollbar mt-6 md:mt-0">
                    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl min-w-[140px] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-100">{stats.completed}</span>
                            <span className="text-lg font-bold text-slate-500">/{stats.total}</span>
                        </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl min-w-[140px] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Calculator size={12}/> Average</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-blue-400">{stats.avgGrade !== null ? stats.avgGrade : '--'}</span>
                            <span className="text-lg font-bold text-slate-500">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cases Breakdown */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-200 pl-2">Case Submissions</h2>
                
                {subjectCases.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900 border border-slate-800 border-dashed rounded-xl text-slate-500 font-medium">
                        No cases assigned to this subject.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {subjectCases.map((c) => {
                            const sub = studentSubmissions.find(s => s.caseId === c.id);
                            
                            // Determine visual state
                            let statusColor = "text-slate-500 bg-slate-800/50 border-slate-700/50";
                            let statusText = "Not Started";
                            if (sub) {
                                if (sub.status.includes('graded')) {
                                    statusColor = "text-blue-400 bg-blue-900/20 border-blue-900/40";
                                    statusText = "Graded";
                                } else if (sub.status.includes('submitted')) {
                                    statusColor = "text-amber-500 bg-amber-900/20 border-amber-900/40";
                                    statusText = "Needs Grading";
                                } else {
                                    statusColor = "text-emerald-500 bg-emerald-900/20 border-emerald-900/40";
                                    statusText = "In Progress";
                                }
                            }

                            return (
                                <div key={c.id} className="bg-slate-900 border border-slate-800 hover:border-primary/50 transition-all shadow-lg rounded-xl flex flex-col sm:flex-row items-stretch overflow-hidden group">
                                    <div className="p-6 flex-1 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-800">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">{c.title}</h3>
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor} whitespace-nowrap`}>
                                                {statusText}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
                                    </div>
                                    
                                    <div className="w-full sm:w-64 bg-slate-900/50 p-6 flex items-center justify-between sm:justify-center gap-6 shrink-0 relative">
                                        {sub ? (
                                            <>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileText size={12}/> Words</span>
                                                    <span className="font-mono text-slate-300 font-semibold">{sub.wordCount || 0}</span>
                                                </div>
                                                <div className="w-px h-8 bg-slate-800"></div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Calculator size={12}/> Score</span>
                                                    <span className={`font-black ${sub.score !== null && sub.score !== undefined ? (sub.score >= 70 ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`}>
                                                        {sub.score !== null && sub.score !== undefined ? `${Math.round(sub.score)}%` : '--'}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full text-slate-500">
                                                <Clock size={20} className="mb-2 opacity-30"/>
                                                <span className="text-xs font-medium uppercase tracking-wider">Awaiting Submissions</span>
                                            </div>
                                        )}
                                        
                                        {(sub && (sub.status.toLowerCase().includes('submitted') || sub.status.toLowerCase().includes('graded'))) && (
                                            <button 
                                                onClick={() => navigate(`/grading/${sub.id}`)}
                                                className="absolute inset-y-0 right-0 w-12 bg-primary hover:bg-primary/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all sm:translate-x-full sm:group-hover:translate-x-0"
                                                title="Open in Grading View"
                                            >
                                                <ChevronRight size={20}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentStats;
