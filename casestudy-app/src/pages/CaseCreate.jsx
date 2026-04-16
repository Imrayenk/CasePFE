import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { ArrowLeft, Save, FileText, Paperclip, X } from 'lucide-react';

const CaseCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addCase, updateCase, cases, fetchCases } = useStore();
  
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Active');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (id && cases) {
      const existingCase = cases.find(c => c.id === id);
      if (existingCase) {
        setTitle(existingCase.title);
        setContent(existingCase.content || existingCase.description);
        setStatus(existingCase.status || 'Active');
        setAttachments(existingCase.attachments || []);
      }
    }
  }, [id, cases]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !content || isSaving) return;
    setIsSaving(true);
    
    try {
      if (id) {
         const existingCase = cases.find(c => c.id === id);
         if (!existingCase) {
             alert("Cannot find original case to update.");
             setIsSaving(false);
             return;
         }
         const success = await updateCase({
           ...existingCase,
           title,
           status,
           description: content.length > 250 ? content.substring(0, 250) + '...' : content,
           content,
           attachments,
           updateHistory: [...(existingCase.updateHistory || []), new Date().toISOString()]
         });
         if (!success) {
            throw new Error("Update failed. You may not have permission.");
         }
      } else {
         const newCase = {
           id: Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + title.substring(0,2).toUpperCase(),
           title,
           description: content.length > 250 ? content.substring(0, 250) + '...' : content,
           content,
           date: new Date().toISOString().split('T')[0],
           status,
           submissions: 0,
           attachments
         };
         const response = await addCase(newCase);
         if (response && response.error) {
             throw new Error(response.error);
         } else if (response === false) {
             throw new Error("Add case rejected. Check connection or your permissions.");
         }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save case: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-background-dark h-full min-h-0">
      <div className="max-w-4xl mx-auto space-y-8 mt-6">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-100">{id ? 'Edit Case Study' : 'Create New Case Study'}</h1>
                <p className="text-slate-400">{id ? 'Modify the existing case scenario.' : 'Draft a new scenario for learners to analyze.'}</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={!title || !content || isSaving}
            className="px-6 py-2 bg-primary rounded-lg text-white font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
          >
            <Save size={18}/> {isSaving ? 'Saving...' : (id ? 'Update Case' : 'Publish Case')}
          </button>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-lg flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Case Title</label>
              <input 
                 type="text"
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 placeholder="e.g. Ethical Dilemma in Logistics"
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors font-medium text-lg placeholder-slate-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Status</label>
              <select 
                 value={status}
                 onChange={e => setStatus(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors font-medium text-lg cursor-pointer"
              >
                 <option value="Active">Active</option>
                 <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-[400px]">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16}/> Case Content (Markdown Supported)
            </label>
            <textarea 
               value={content}
               onChange={e => setContent(e.target.value)}
               placeholder="# Introduction\nStart drafting the case study here..."
               className="w-full h-full min-h-[300px] bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-300 focus:outline-none focus:border-primary transition-colors font-mono text-sm leading-relaxed placeholder-slate-600 custom-scrollbar resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Paperclip size={16}/> Supporting Documents
            </label>
            <div className="flex flex-col gap-4">
              <label className="border-2 border-dashed border-slate-700 bg-slate-800/30 hover:bg-slate-800/80 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer text-center group">
                 <input 
                   type="file" 
                   multiple 
                   className="hidden" 
                   onChange={(e) => {
                     const newFiles = Array.from(e.target.files).map(f => ({
                        name: f.name,
                        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                        type: f.type || 'Unknown'
                     }));
                     setAttachments(prev => [...prev, ...newFiles]);
                   }} 
                 />
                 <div className="size-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/20 transition-all mb-3">
                    <Paperclip size={24}/>
                 </div>
                 <p className="text-slate-300 font-bold">Click to upload supporting files</p>
                 <p className="text-slate-500 text-sm mt-1">PDF, DOCX, XLSX, or Images (Max 10MB)</p>
              </label>

              {attachments.length > 0 && (
                 <div className="flex flex-col gap-2">
                   {attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                         <div className="flex items-center gap-3">
                            <FileText size={18} className="text-blue-400"/>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-slate-200">{file.name}</span>
                               <span className="text-xs text-slate-500">{file.size}</span>
                            </div>
                         </div>
                         <button 
                           onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                           className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                         >
                            <X size={16}/>
                         </button>
                      </div>
                   ))}
                 </div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
             <p className="text-sm text-slate-400">
                <strong className="text-slate-200">Note:</strong> Learners will solve this case through the guided steps and submit a required concept map for teacher review.
             </p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default CaseCreate;
