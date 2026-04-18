import React, { useState, useRef } from 'react';
import useStore from '../store/useStore';
import { Search, Download, ZoomIn, ZoomOut, Copy, Edit3, Paperclip, FileText, List, ChevronRight, ChevronUp, ChevronDown, Settings } from 'lucide-react';

const CaseReader = () => {
  const { currentCase, addKeyword, addSelectedTextToEvidence, copySelectionToCurrentStep, keywords } = useStore();
  const readerRef = useRef(null);
  
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0, show: false });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showToc, setShowToc] = useState(false);
  const [scrollProgress, setScrollProgress] = useState({ current: 1, total: 1 });
  const [currentSearchIndex, setCurrentSearchIndex] = useState(1);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [typography, setTypography] = useState({ font: 'font-sans', spacing: 'leading-relaxed' });

  // Handle text selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (text.length > 3 && readerRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // Position the float menu above the selection
      setSelection({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 50, // 50px above
        show: true
      });
    } else {
      setSelection(s => ({ ...s, show: false }));
    }
  };

  const clearSelection = () => {
    window.getSelection().removeAllRanges();
    setSelection(s => ({ ...s, show: false }));
  };

  const handleAddKeyword = (category) => {
    addKeyword(selection.text, category);
    clearSelection();
  };

  const text = currentCase?.content || currentCase?.description || '';
  const lines = text.split('\n');

  let totalSearchMatches = 0;
  if(showSearch && searchTerm.length >= 2) {
      const lowerSearch = searchTerm.toLowerCase();
      lines.forEach(line => {
          if(!line.startsWith('# ') && !line.startsWith('## ') && !line.startsWith('To:') && !line.startsWith('From:') && !line.startsWith('Date:') && line.trim() !== '') {
              let startIndex = 0;
              let lowerText = line.toLowerCase();
              while((startIndex = lowerText.indexOf(lowerSearch, startIndex)) > -1) {
                  totalSearchMatches++;
                  startIndex += lowerSearch.length;
              }
          }
      });
  }

  let globalSearchIndex = 0;

  const renderHighlightedLine = (lineText) => {
    if ((!keywords || keywords.length === 0) && (!showSearch || searchTerm.length < 2)) return lineText;
    
    let matches = [];
    
    if (keywords && keywords.length > 0) {
      keywords.forEach(kw => {
        if (!kw.text || kw.text.length < 3) return;
        let startIndex = 0;
        let lowerText = lineText.toLowerCase();
        let lowerKw = kw.text.toLowerCase();
        while ((startIndex = lowerText.indexOf(lowerKw, startIndex)) > -1) {
          matches.push({ start: startIndex, end: startIndex + kw.text.length, category: kw.category, type: 'keyword' });
          startIndex += kw.text.length;
        }
      });
    }

    if (showSearch && searchTerm && searchTerm.length >= 2) {
      let startIndex = 0;
      let lowerText = lineText.toLowerCase();
      let lowerSearch = searchTerm.toLowerCase();
      while ((startIndex = lowerText.indexOf(lowerSearch, startIndex)) > -1) {
        globalSearchIndex++;
        matches.push({ start: startIndex, end: startIndex + searchTerm.length, type: 'search', searchIndex: globalSearchIndex });
        startIndex += searchTerm.length;
      }
    }

    if (matches.length === 0) return lineText;

    matches.sort((a, b) => a.start !== b.start ? a.start - b.start : (a.type === b.type ? (b.end - b.start) - (a.end - a.start) : (a.type === 'search' ? -1 : 1)));

    let nonOverlapping = [];
    let currentEnd = 0;
    for (let match of matches) {
      if (match.start >= currentEnd) {
        nonOverlapping.push(match);
        currentEnd = match.end;
      }
    }

    if (nonOverlapping.length === 0) return lineText;

    let elements = [];
    let lastIndex = 0;
    nonOverlapping.forEach((match, index) => {
      elements.push(lineText.substring(lastIndex, match.start));
      
      let colorClass = '';
      if (match.type === 'keyword') {
         colorClass = match.category === 'yellow' ? 'bg-amber-900/40 text-amber-200 border-b-2 border-amber-500' : 'bg-blue-900/40 text-blue-200 border-b-2 border-blue-500';
      } else if (match.type === 'search') {
         const isActive = match.searchIndex === currentSearchIndex;
         colorClass = isActive ? 'bg-emerald-500 text-white font-bold' : 'bg-emerald-900/60 text-emerald-200 border-b-2 border-emerald-500';
      }

      elements.push(
        <mark key={index} id={match.type === 'search' ? `search-match-${match.searchIndex}` : undefined} className={`bg-transparent ${colorClass} rounded px-0.5 transition-colors`}>
          {lineText.substring(match.start, match.end)}
        </mark>
      );
      lastIndex = match.end;
    });
    elements.push(lineText.substring(lastIndex));

    return <>{elements}</>;
  };

  const scrollToMatch = (index) => {
      setTimeout(() => {
          document.getElementById(`search-match-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
  };

  const handleNextSearch = (e) => {
      e.preventDefault();
      if (totalSearchMatches === 0) return;
      const nextIndex = currentSearchIndex < totalSearchMatches ? currentSearchIndex + 1 : 1;
      setCurrentSearchIndex(nextIndex);
      scrollToMatch(nextIndex);
  };

  const handlePrevSearch = (e) => {
      e.preventDefault();
      if (totalSearchMatches === 0) return;
      const prevIndex = currentSearchIndex > 1 ? currentSearchIndex - 1 : totalSearchMatches;
      setCurrentSearchIndex(prevIndex);
      scrollToMatch(prevIndex);
  };

  const tocItems = lines.map((line, i) => {
      if(line.startsWith('# ')) return { id: `heading-${i}`, title: line.substring(2), level: 1 };
      if(line.startsWith('## ')) return { id: `heading-${i}`, title: line.substring(3), level: 2 };
      return null;
  }).filter(Boolean);

  const handleExport = () => {
     if (!currentCase) return;
     const mdContent = `# Case Study Export: ${currentCase.title || 'Untitled'}\n\n## Document Content\n\n${currentCase.content || currentCase.description || ''}\n\n---\n\n## Extracted Concepts (${keywords?.length || 0})\n\n${keywords && keywords.length > 0 ? keywords.map(kw => `- [${kw.category.toUpperCase()}] ${kw.text}`).join('\n') : '*No concepts extracted.*'}`;
     const blob = new Blob([mdContent], { type: 'text/markdown' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `Export_${currentCase.title?.replace(/\s+/g, '_') || 'CaseStudy'}.md`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  const handleAttachmentClick = (e, file, action) => {
      e.stopPropagation();
      let targetUrl = file.url && file.url !== '#' ? file.url : null;
      let isTemp = false;

      if (!targetUrl || targetUrl.startsWith('data:')) {
          try {
              let blob;
              if (targetUrl && targetUrl.startsWith('data:')) {
                  const parts = targetUrl.split(',');
                  const mime = parts[0].match(/:(.*?);/)[1];
                  const bstr = atob(parts[1]);
                  let n = bstr.length;
                  const u8arr = new Uint8Array(n);
                  while (n--) {
                     u8arr[n] = bstr.charCodeAt(n);
                  }
                  blob = new Blob([u8arr], { type: mime });
              } else {
                  blob = new Blob([`Mock content for ${file.name}\n\nSize: ${file.size}\nType: ${file.type}`], { type: file.type || 'text/plain' });
              }
              targetUrl = URL.createObjectURL(blob);
              isTemp = true;
          } catch (err) {
              console.error('Error parsing file data', err);
              if (!targetUrl) targetUrl = '#'; // Fallback
          }
      }

      if (action === 'download') {
          const a = document.createElement('a');
          a.href = targetUrl;
          a.download = file.name || 'download';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      } else {
          window.open(targetUrl, '_blank');
      }

      if (isTemp) {
          // Clean up blob url after a short delay so the browser has time to start downloading/opening
          setTimeout(() => URL.revokeObjectURL(targetUrl), 1000);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 z-20 bg-slate-900 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => setShowToc(!showToc)}
             className={`p-1.5 rounded-lg transition-colors ${showToc ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
             title="Table of Contents"
          >
             <List size={20} />
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          <h3 className="font-bold text-slate-200 hidden sm:block">Case Reader</h3>
          <div className="flex gap-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/30 text-amber-500 border border-amber-900/50 uppercase tracking-wider">Confidential</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showSearch && (
            <form onSubmit={handleNextSearch} className="flex items-center gap-2 mr-2">
              <input 
                 autoFocus
                 type="text" 
                 value={searchTerm} 
                 onChange={e => { setSearchTerm(e.target.value); setCurrentSearchIndex(1); }} 
                 placeholder="Search in document..."
                 className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-primary w-40 sm:w-48"
              />
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap min-w-[2.5rem] text-center">
                  {totalSearchMatches > 0 ? `${currentSearchIndex}/${totalSearchMatches}` : '0/0'}
              </span>
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button type="button" onClick={handlePrevSearch} className="text-slate-400 hover:text-white px-1.5 py-1 transition-colors rounded">
                     <ChevronUp size={14}/>
                  </button>
                  <button type="submit" className="text-slate-400 hover:text-white px-1.5 py-1 transition-colors rounded">
                     <ChevronDown size={14}/>
                  </button>
              </div>
            </form>
          )}
          <button 
             onClick={() => { setShowDisplaySettings(false); setShowSearch(!showSearch); }}
             className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${showSearch ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
          >
            <Search size={14} /> {showSearch ? 'Close' : 'Find'}
          </button>
          <div className="relative">
             <button 
                onClick={() => { setShowSearch(false); setShowDisplaySettings(!showDisplaySettings); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${showDisplaySettings ? 'bg-slate-800 border-slate-600 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
             >
                <Settings size={14} /> Display
             </button>
             {showDisplaySettings && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 flex flex-col gap-4">
                     <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Family</label>
                         <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                             <button onClick={() => setTypography(prev => ({...prev, font: 'font-sans'}))} className={`flex-1 text-xs py-1.5 rounded transition-colors ${typography.font === 'font-sans' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Sans</button>
                             <button onClick={() => setTypography(prev => ({...prev, font: 'font-serif'}))} className={`flex-1 text-xs py-1.5 rounded transition-colors font-serif ${typography.font === 'font-serif' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Serif</button>
                         </div>
                     </div>
                     <div className="flex flex-col gap-2">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Spacing</label>
                         <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                             <button onClick={() => setTypography(prev => ({...prev, spacing: 'leading-normal'}))} className={`flex-1 text-xs py-1.5 rounded transition-colors ${typography.spacing === 'leading-normal' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Tight</button>
                             <button onClick={() => setTypography(prev => ({...prev, spacing: 'leading-relaxed'}))} className={`flex-1 text-xs py-1.5 rounded transition-colors ${typography.spacing === 'leading-relaxed' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Relaxed</button>
                             <button onClick={() => setTypography(prev => ({...prev, spacing: 'leading-loose'}))} className={`flex-1 text-xs py-1.5 rounded transition-colors ${typography.spacing === 'leading-loose' ? 'bg-slate-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}>Loose</button>
                         </div>
                     </div>
                 </div>
             )}
          </div>
          <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* TOC Sidebar */}
        <div className={`absolute top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-700 shadow-2xl z-20 transition-transform duration-300 ease-in-out flex flex-col ${showToc ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-slate-800 font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center justify-between">
               Table of Contents
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {tocItems.length === 0 ? (
                   <p className="text-slate-500 text-sm p-4 text-center">No headers found in document.</p>
                ) : (
                   <div className="flex flex-col gap-1">
                      {tocItems.map((item) => (
                         <button
                            key={item.id}
                            onClick={() => {
                               setShowToc(false);
                               document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 ${item.level === 1 ? 'font-bold text-slate-300 mt-2' : 'font-medium text-slate-400 ml-4'}`}
                         >
                            {item.level === 1 && <ChevronRight size={14} className="text-primary opacity-50"/>}
                            <span className="truncate">{item.title}</span>
                         </button>
                      ))}
                   </div>
                )}
            </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-background-dark/50 relative scroll-smooth"
          onMouseUp={handleMouseUp}
          onScroll={(e) => {
             const { scrollTop, scrollHeight, clientHeight } = e.target;
             const totalPages = Math.max(1, Math.ceil(scrollHeight / clientHeight));
             const currentPage = Math.min(totalPages, Math.max(1, Math.ceil((scrollTop + clientHeight / 2) / clientHeight)));
             setScrollProgress({ current: currentPage, total: totalPages });
          }}
          ref={readerRef}
        >
        <div 
          className="max-w-2xl mx-auto bg-slate-800 p-8 md:p-12 shadow-2xl rounded-2xl border border-slate-700 min-h-full transition-transform origin-top"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <article className={`prose prose-invert max-w-none text-slate-300 transition-all duration-300 ${typography.font} ${typography.spacing}`}>
             {(() => {
                const text = currentCase?.content || currentCase?.description || '';
                const lines = text.split('\n');
                return lines.map((line, i) => {
                   if (line.startsWith('# ')) {
                      return <h1 id={`heading-${i}`} key={i} className="text-3xl font-bold mb-6 text-slate-100 border-b border-slate-700 pb-4 pt-8 shrink-0">{line.substring(2)}</h1>;
                   } else if (line.startsWith('## ')) {
                      return (
                        <h2 id={`heading-${i}`} key={i} className="text-xl font-bold mt-12 mb-4 text-slate-100 flex items-center gap-3 pt-4 shrink-0">
                           <span className="bg-primary/20 text-primary size-8 rounded-lg flex items-center justify-center text-sm">{i}</span>
                           {line.substring(3)}
                        </h2>
                      );
                   } else if (line.startsWith('To:') || line.startsWith('From:') || line.startsWith('Date:')) {
                      return (
                        <div key={i} className="bg-slate-900/50 p-2 rounded-lg mb-2 border border-slate-700/50">
                            <p className="m-0 text-slate-400 leading-relaxed font-medium">{line}</p>
                        </div>
                      )
                   } else if (line.trim() !== '') {
                      return <p key={i} className="mb-6 leading-relaxed text-slate-300 text-lg">{renderHighlightedLine(line)}</p>;
                   }
                   return null;
                });
             })()}
             
             {currentCase?.attachments && currentCase.attachments.length > 0 && (
                 <div className="mt-12 pt-8 border-t border-slate-700/50">
                     <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
                         <Paperclip className="text-primary" size={20}/> Supporting Resources
                     </h3>
                     <div className="grid sm:grid-cols-2 gap-4">
                         {currentCase.attachments.map((file, i) => (
                             <div 
                                key={i} 
                                onClick={(e) => handleAttachmentClick(e, file, 'open')}
                                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer"
                             >
                                 <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="size-10 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                         <FileText size={20}/>
                                     </div>
                                     <div className="truncate">
                                         <p className="text-sm font-bold text-slate-200 truncate pr-2">{file.name}</p>
                                         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{file.size} • {file.type}</p>
                                     </div>
                                 </div>
                                 <button 
                                     onClick={(e) => handleAttachmentClick(e, file, 'download')}
                                     className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                     title="Download File"
                                 >
                                     <Download size={16}/>
                                 </button>
                             </div>
                         ))}
                     </div>
                 </div>
             )}
             
             <div className="mt-16 pt-8 border-t border-slate-700 italic text-slate-500 text-center text-sm">
                 [End of Document]
             </div>
          </article>
        </div>

        {/* Highlight Menu Float */}
        {selection.show && (
          <div 
            onMouseDown={(e) => e.preventDefault()}
            className="fixed bg-slate-950 text-white rounded-xl shadow-2xl p-1.5 flex gap-1 flex-col items-center border border-slate-700 animate-in fade-in zoom-in duration-200 z-50"
            style={{ left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)' }}
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 pt-1">Use Selection</div>
            <div className="flex items-center gap-1 p-1">
                <button 
                  onClick={() => { addSelectedTextToEvidence(selection.text); clearSelection(); }}
                  className="p-2 hover:bg-slate-800 rounded-lg text-amber-500 transition-colors"
                  title="Add as Evidence"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleAddKeyword('blue')}
                  className="p-2 hover:bg-slate-800 rounded-lg text-blue-400 transition-colors"
                  title="Highlight only"
                >
                  <Edit3 size={18} />
                </button>
                <div className="w-px h-6 bg-slate-800 mx-1"></div>
                <button 
                  onClick={() => { copySelectionToCurrentStep(selection.text); clearSelection(); }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
                  title="Copy to Current Step"
                >
                  <Copy size={18} />
                </button>
            </div>
          </div>
        )}
      </div></div>

      <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-center gap-4 shrink-0 z-10">
        <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
            className="text-slate-500 hover:text-primary transition-colors mb-4 md:mb-0"
        >
            <ZoomIn size={20}/>
        </button>
        <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
            className="text-slate-500 hover:text-primary transition-colors mb-4 md:mb-0"
        >
            <ZoomOut size={20}/>
        </button>
        <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
        <div className="text-xs font-medium text-slate-500 hidden md:flex items-center gap-1">Page {scrollProgress.current} of {scrollProgress.total}</div>
      </div>
    </div>
  );
};

export default CaseReader;
