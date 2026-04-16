import React, { useCallback, useState } from 'react';
import dagre from 'dagre';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Handle,
  Position,
  getBezierPath,
  BaseEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useStore from '../store/useStore';
import { Search, MoreVertical, CheckCircle, Trash2, Wand2 } from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 150;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

// --- Shared Node Logic for Editing & Deleting ---
const NodeContent = ({ id, data, typeColor, typeLabel, textareaClassName = "", textClassName = "", children }) => {
  const { updateNodeLabel, deleteNode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== data.label) {
      updateNodeLabel(id, text.trim() || 'Empty Node');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteNode(id);
  };

  const defaultTextareaClass = "w-full bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-600 rounded p-1 focus:outline-none focus:border-primary resize-none custom-scrollbar";
  const defaultTextClass = "text-sm font-semibold text-slate-200 cursor-text";

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>{typeLabel}</span>
        <button onClick={handleDelete} className="text-slate-600 hover:text-rose-500 transition-colors p-1" title="Delete Node">
          <Trash2 size={14}/>
        </button>
      </div>
      {isEditing ? (
        <textarea 
          autoFocus
          className={textareaClassName || defaultTextareaClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={3}
        />
      ) : (
        <p className={textClassName || defaultTextClass} onDoubleClick={handleDoubleClick}>
          {data.label}
        </p>
      )}
      {children}
    </>
  );
};

// --- Custom Edge with Deletion ---
const DeletableEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: selected ? 4 : 2, stroke: selected ? '#ef4444' : '#1349ec' }} />
    </>
  );
};

// --- Custom Node Components ---
const ProblemNode = ({ id, data }) => (
  <div className="relative w-56 bg-slate-900 border-l-4 border-rose-500 rounded-xl shadow-2xl p-4 border-slate-800 border group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-rose-500" typeLabel="Main Problem" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500 z-20" />
  </div>
);

const CauseNode = ({ id, data }) => (
  <div className="relative w-56 bg-slate-900 border-l-4 border-amber-500 rounded-xl shadow-2xl p-4 border-slate-800 border group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-amber-500" typeLabel="Root Cause" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 z-20" />
  </div>
);

const AnalysisNode = ({ id, data }) => (
  <div className="relative w-64 bg-slate-900 border-l-4 border-primary rounded-xl shadow-2xl p-4 border-2 border-primary/20 group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-primary" typeLabel="Justification" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary z-20" />
  </div>
);

const SolutionNode = ({ id, data }) => (
  <div className="relative w-56 bg-slate-900 border-l-4 border-emerald-500 rounded-xl shadow-2xl p-4 border-slate-800 border group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-emerald-500" typeLabel="Possible Solution" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 z-20" />
  </div>
);

const NoteNode = ({ id, data }) => (
  <div className="relative w-48 bg-yellow-400 border-t-8 border-yellow-500 rounded-b-xl shadow-2xl p-4 group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent 
        id={id} 
        data={data} 
        typeColor="text-yellow-900" 
        typeLabel="Note" 
        textareaClassName="w-full bg-yellow-200/80 text-sm font-bold text-yellow-950 border border-yellow-500 rounded p-2 focus:outline-none focus:border-yellow-700 resize-none custom-scrollbar placeholder:text-yellow-700"
        textClassName="text-sm font-bold text-yellow-950 cursor-text leading-relaxed"
      />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-600 z-20" />
  </div>
);

const EvidenceNode = ({ id, data }) => (
  <div className="relative w-64 bg-sky-950/80 border-l-4 border-sky-400 rounded-xl shadow-2xl p-4 border-2 border-sky-900 group">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-sky-400" typeLabel="Evidence" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-sky-400 z-20" />
  </div>
);

const ConclusionNode = ({ id, data }) => {
  const { updateNodeLabel, deleteNode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim() !== data.label) {
      updateNodeLabel(id, text.trim() || 'Empty Goal');
    }
  };

  return (
    <div className="relative w-64 bg-white text-slate-900 rounded-xl shadow-2xl p-4 ring-4 ring-primary/30 group">
      <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0" />
      <div className="relative z-10 w-full h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recommendation</span>
          <div className="flex items-center gap-2">
              <button onClick={() => deleteNode(id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Delete Node">
                  <Trash2 size={14}/>
              </button>
              <CheckCircle size={14} className="text-primary"/>
          </div>
        </div>
        {isEditing ? (
          <textarea 
            autoFocus
             className="w-full bg-slate-100 text-sm font-semibold text-slate-900 border border-slate-300 rounded p-1 focus:outline-none focus:border-primary resize-none"
             value={text}
             onChange={(e) => setText(e.target.value)}
             onBlur={handleBlur}
             onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
             rows={3}
          />
        ) : (
          <p className="text-sm font-semibold cursor-text" onDoubleClick={() => setIsEditing(true)}>{data.label}</p>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  problemNode: ProblemNode,
  causeNode: CauseNode,
  analysisNode: AnalysisNode,
  solutionNode: SolutionNode,
  conclusionNode: ConclusionNode,
  noteNode: NoteNode,
  evidenceNode: EvidenceNode
};

const edgeTypes = {
  deletable: DeletableEdge
};

// --- Main Component ---
const ConceptMapper = () => {
  const { nodes, edges, setNodes, setEdges, deleteNode, saveDraft, keywords } = useStore();
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Auto-save changes (nodes, edges, or keywords)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 200); // Instant feel (200ms)

    return () => clearTimeout(timer);
  }, [nodes, edges, keywords, saveDraft]);

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setContextMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [setContextMenu]
  );

  const deleteEdgeFromContextMenu = useCallback(() => {
    if (contextMenu) {
       setEdges((eds) => eds.filter((e) => e.id !== contextMenu.id));
       setContextMenu(null);
    }
  }, [contextMenu, setEdges]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  
  const onConnect = useCallback(
    (connection) => {
        const newEdge = { 
            ...connection, 
            type: 'deletable',
            animated: true, 
            style: { stroke: '#1349ec', strokeWidth: 2 } 
        };
        setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => reactFlowInstance?.fitView({ duration: 800 }), 50);
  }, [nodes, edges, reactFlowInstance, setNodes, setEdges]);

  const onNodesDelete = useCallback((deleted) => {
    deleted.forEach(node => deleteNode(node.id));
  }, [deleteNode]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      let type = event.dataTransfer.getData('application/reactflow');
      let label = event.dataTransfer.getData('application/label');
      const plainText = event.dataTransfer.getData('text/plain');

      // Native text drag capability (e.g. dragging from Case Reader)
      if (!type && plainText) {
          type = 'noteNode';
          label = plainText.trim();
      }

      if (!type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-dark/95 relative w-full group/canvas">
      
      {/* Search and Controls Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10 w-full max-w-xl px-4 pointer-events-none">
        <div className="flex-1 bg-slate-900 shadow-2xl rounded-xl flex items-center px-4 h-12 border border-slate-800 pointer-events-auto filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <Search size={18} className="text-slate-500 mr-3 shrink-0" />
          <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 text-slate-200 outline-none" placeholder="Search concepts or notes..." type="text"/>
        </div>
        
        <button 
          onClick={onLayout}
          title="Auto-Format Concept Tree"
          className="bg-primary hover:bg-blue-600 text-white shadow-2xl rounded-xl h-12 px-4 border border-blue-500 pointer-events-auto flex items-center gap-2 font-semibold transition-all transform hover:scale-105 active:scale-95"
        >
          <Wand2 size={18} />
          <span className="hidden sm:inline">Tidy Map</span>
        </button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 w-full h-full" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges.map(e => ({...e, type: 'deletable', animated: true, style: {stroke: e.selected ? '#ef4444' : '#1349ec', strokeWidth: e.selected ? 4 : 2}}))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onEdgeContextMenu={onEdgeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={setReactFlowInstance}
          fitView
          className="bg-transparent"
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#334155" size={1} gap={30} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-slate-300 bottom-24 right-4" position="bottom-right"/>
        </ReactFlow>

        {contextMenu && (
          <div 
            style={{ top: contextMenu.top, left: contextMenu.left }} 
            className="fixed bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 min-w-40 z-[100] transform -translate-x-1/2 -translate-y-full mt-[-10px] animate-in zoom-in-95 duration-100"
            onMouseLeave={() => setContextMenu(null)}
          >
            <button 
              onClick={deleteEdgeFromContextMenu}
              className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-slate-800 flex items-center gap-2 font-semibold transition-colors"
            >
              <Trash2 size={16} /> Delete Connection
            </button>
          </div>
        )}
      </div>

      {/* Footer Node Tray */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-20 shrink-0">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-4">Drag Node:</span>
          
          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-slate-800 px-6 cursor-grab active:cursor-grabbing hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-900"
            onDragStart={(event) => onDragStart(event, 'problemNode', 'Double click to edit main problem...')} draggable
          >
            <div className="size-2 rounded-full bg-rose-500"></div>
            <p className="text-slate-200 text-sm font-semibold">Main Problem</p>
          </div>
          
          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-slate-800 px-6 cursor-grab active:cursor-grabbing hover:bg-amber-950/30 transition-colors border border-transparent hover:border-amber-900"
            onDragStart={(event) => onDragStart(event, 'causeNode', 'Double click to edit root cause...')} draggable
          >
            <div className="size-2 rounded-full bg-amber-500"></div>
            <p className="text-slate-200 text-sm font-semibold">Root Cause</p>
          </div>
          
          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-slate-800 px-6 cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-colors border border-transparent hover:border-primary/30"
            onDragStart={(event) => onDragStart(event, 'analysisNode', 'Double click to edit justification...')} draggable
          >
            <div className="size-2 rounded-full bg-primary"></div>
            <p className="text-slate-200 text-sm font-semibold">Justification</p>
          </div>
          
          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-slate-800 px-6 cursor-grab active:cursor-grabbing hover:bg-emerald-950/30 transition-colors border border-transparent hover:border-emerald-900"
            onDragStart={(event) => onDragStart(event, 'solutionNode', 'Double click to edit possible solution...')} draggable
          >
            <div className="size-2 rounded-full bg-emerald-500"></div>
            <p className="text-slate-200 text-sm font-semibold">Possible Solution</p>
          </div>
          
          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-slate-800 px-6 cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors border border-transparent"
            onDragStart={(event) => onDragStart(event, 'conclusionNode', 'Final recommendation...')} draggable
          >
            <div className="size-2 rounded-full bg-slate-100"></div>
            <p className="text-slate-200 text-sm font-semibold">Recommendation</p>
          </div>
          
          <div className="w-px h-8 bg-slate-700 mx-2"></div>

          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-yellow-500/20 px-6 cursor-grab active:cursor-grabbing hover:bg-yellow-500/30 transition-colors border border-transparent hover:border-yellow-500"
            onDragStart={(event) => onDragStart(event, 'noteNode', 'Double click to edit note...')} draggable
          >
            <div className="size-2 rounded-full bg-yellow-500"></div>
            <p className="text-yellow-400 text-sm font-bold">Note</p>
          </div>

          <div 
            className="flex h-12 shrink-0 items-center justify-center gap-x-3 rounded-xl bg-sky-900/30 px-6 cursor-grab active:cursor-grabbing hover:bg-sky-900/50 transition-colors border border-transparent hover:border-sky-700"
            onDragStart={(event) => onDragStart(event, 'evidenceNode', 'Data or quote from case...')} draggable
          >
            <div className="size-2 rounded-full bg-sky-400"></div>
            <p className="text-sky-200 text-sm font-semibold">Evidence</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ConceptMapper;
