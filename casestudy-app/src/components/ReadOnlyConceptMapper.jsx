import React, { useEffect, useState } from 'react';
import dagre from 'dagre';
import { 
  ReactFlow, 
  Background, 
  Handle,
  Position,
  getBezierPath,
  BaseEdge,
  useReactFlow,
  ReactFlowProvider,
  Controls
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Shared ReadOnly Node Logic ---
const NodeContent = ({ id, data, typeColor, typeLabel, textClassName = "", children }) => {
  const defaultTextClass = "text-sm font-semibold text-slate-200 cursor-default";

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColor}`}>{typeLabel}</span>
      </div>
      <p className={textClassName || defaultTextClass}>
        {data.label}
      </p>
      {children}
    </>
  );
};

// --- Custom Edge ---
const ReadOnlyEdge = ({
  id,
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
  <div className="relative w-56 bg-slate-900 border-l-4 border-rose-500 rounded-xl shadow-2xl p-4 border-slate-800 border">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-rose-500" typeLabel="Problem" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500 z-20 opacity-0" />
  </div>
);

const CauseNode = ({ id, data }) => (
  <div className="relative w-56 bg-slate-900 border-l-4 border-amber-500 rounded-xl shadow-2xl p-4 border-slate-800 border">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-amber-500" typeLabel="Cause" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 z-20 opacity-0" />
  </div>
);

const AnalysisNode = ({ id, data }) => (
  <div className="relative w-64 bg-slate-900 border-l-4 border-primary rounded-xl shadow-2xl p-4 border-2 border-primary/20">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-primary" typeLabel="Analysis" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary z-20 opacity-0" />
  </div>
);

const SolutionNode = ({ id, data }) => (
  <div className="relative w-56 bg-slate-900 border-l-4 border-emerald-500 rounded-xl shadow-2xl p-4 border-slate-800 border">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-emerald-500" typeLabel="Solution" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 z-20 opacity-0" />
  </div>
);

const NoteNode = ({ id, data }) => (
  <div className="relative w-48 bg-yellow-400 border-t-8 border-yellow-500 rounded-b-xl shadow-2xl p-4">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent 
        id={id} 
        data={data} 
        typeColor="text-yellow-900" 
        typeLabel="Note" 
        textClassName="text-sm font-bold text-yellow-950 cursor-default leading-relaxed"
      />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-600 z-20 opacity-0" />
  </div>
);

const EvidenceNode = ({ id, data }) => (
  <div className="relative w-64 bg-sky-950/80 border-l-4 border-sky-400 rounded-xl shadow-2xl p-4 border-2 border-sky-900">
    <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
    <div className="relative z-10 w-full h-full">
      <NodeContent id={id} data={data} typeColor="text-sky-400" typeLabel="Evidence" />
    </div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-sky-400 z-20 opacity-0" />
  </div>
);

const ConclusionNode = ({ id, data }) => {
  return (
    <div className="relative w-64 bg-white text-slate-900 rounded-xl shadow-2xl p-4 ring-4 ring-primary/30">
      <Handle type="target" position={Position.Top} className="!w-full !h-full !top-0 !left-0 !transform-none !border-none !bg-transparent !rounded-none z-0 disabled opacity-0" />
      <div className="relative z-10 w-full h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Conclusion</span>
        </div>
        <p className="text-sm font-semibold cursor-default">{data.label}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary z-20 opacity-0" />
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
  deletable: ReadOnlyEdge
};

// --- Sub-Component that uses useReactFlow ---
const LayoutCanvas = ({ initialNodes, initialEdges }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (!initialNodes || !initialEdges) return;
    
    setNodes(initialNodes.map(n => ({ ...n, draggable: false })));
    setEdges(initialEdges.map(e => ({ ...e, type: 'deletable', animated: true, style: {stroke: e.selected ? '#ef4444' : '#1349ec', strokeWidth: e.selected ? 4 : 2} })));
    
    setTimeout(() => {
      reactFlowInstance.fitView({ duration: 800, padding: 0.2 });
    }, 100);
  }, [initialNodes, initialEdges, reactFlowInstance]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
      className="bg-slate-900"
    >
      <Background color="#334155" size={1} gap={30} />
      <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 fill-slate-300" position="bottom-right" showInteractive={false} />
    </ReactFlow>
  );
};

const ReadOnlyConceptMapper = ({ nodes = [], edges = [] }) => {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 min-h-[400px]">
      <ReactFlowProvider>
        <LayoutCanvas initialNodes={nodes} initialEdges={edges} />
      </ReactFlowProvider>
    </div>
  );
};

export default ReadOnlyConceptMapper;
