import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import CaseReader from '../components/CaseReader';
import SummaryEditor from '../components/SummaryEditor';
import ConceptMapper from '../components/ConceptMapper';

const Workspace = () => {
  const { id } = useParams();
  const { setCurrentCase, fetchDraft, fetchCases } = useStore();
  
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (id) {
       setCurrentCase(id);
       fetchDraft(id);
    }
  }, [id, setCurrentCase, fetchDraft]);
  return (
    <div className="flex-1 flex overflow-hidden w-full h-full relative z-10 bg-background-dark">
      {/* Mapper Container (Background layer essentially but restricted) */}
      <div className="absolute inset-0 pointer-events-none z-0">
         {/* We will render ConceptMapper here but enable pointer events on it */}
         <div className="w-full h-full pointer-events-auto">
            <ConceptMapper />
         </div>
      </div>
      
      {/* Front Panels overlaying left and right over the mapper background?
          Wait, the designs showed: Left: Reader, Right: Summary Editor. 
          The Concept Mapper was its own full screen. 
          Let's verify the navigation. The design didn't explicitly split 3 screens simultaneously.
          Actually, the left sidebar had tools for "Canvas Designer", "History", etc.
          Let's create a classic layout: Reader & Editor on split screen, and a toggle for Concept Mapper view, 
          OR ConceptMapper takes the full screen when invoked.
          Let's implement tabs or internal routing for the workspace.
      */}
      <WorkspaceInternal />
    </div>
  );
};

const WorkspaceInternal = () => {
    const [activeTab, setActiveTab] = React.useState('reader_editor');
    
    return (
        <div className="flex-1 flex flex-col w-full h-full z-10 relative bg-background-dark">
            <div className="flex items-center justify-center py-2 bg-slate-900 border-b border-slate-800 z-20 shadow-md">
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('reader_editor')} 
                        onDragEnter={(e) => { e.preventDefault(); setActiveTab('reader_editor'); }}
                        onDragOver={(e) => e.preventDefault()}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'reader_editor' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                        Case Study & Summary
                    </button>
                    <button 
                        onClick={() => setActiveTab('mapper')} 
                        onDragEnter={(e) => { e.preventDefault(); setActiveTab('mapper'); }}
                        onDragOver={(e) => e.preventDefault()}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'mapper' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                        Concept Mapper
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden w-full h-full">
                {activeTab === 'reader_editor' && (
                    <div className="flex flex-col lg:flex-row w-full h-full animate-in fade-in duration-300">
                        {/* Left Side: Case Reader */}
                        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-800 relative bg-slate-900 flex flex-col min-h-0 lg:min-w-0">
                            <CaseReader />
                        </div>
                        {/* Right Side: Summary Editor */}
                        <div className="flex-1 flex flex-col relative bg-background-dark min-h-0 lg:min-w-0">
                            <SummaryEditor setActiveTab={setActiveTab} />
                        </div>
                    </div>
                )}
                {activeTab === 'mapper' && (
                    <div className="w-full h-full animate-in fade-in duration-300 flex">
                        <ConceptMapper setActiveTab={setActiveTab} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Workspace;
