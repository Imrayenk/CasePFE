import React from 'react';
import { Network, Brain, Award, ShieldCheck, Zap, PenTool } from 'lucide-react';

const features = [
  {
    icon: <Network className="w-8 h-8 text-blue-400" />,
    title: "Visual Concept Mapping",
    description: "Map out complex relationships and pinpoint root causes with our intelligent canvas interface to better structure your analysis."
  },
  {
    icon: <Brain className="w-8 h-8 text-purple-400" />,
    title: "AI-Powered Synthesis",
    description: "Our integrated LLM technology helps summarize your extracted concepts into professional, cohesive compliance drafts dynamically."
  },
  {
    icon: <Award className="w-8 h-8 text-amber-400" />,
    title: "Teacher Review",
    description: "Submit the final case solution for instructor feedback, grading, and clear next steps after review."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-teal-400" />,
    title: "Secure workspaces",
    description: "Dedicated isolated environments for every case study you undertake, securely synced to your account in real-time."
  },
  {
    icon: <Zap className="w-8 h-8 text-rose-400" />,
    title: "Social Learning",
    description: "Share your completed analyses, view your peers' submissions, and engage through threaded comments to foster collaboration."
  },
  {
    icon: <PenTool className="w-8 h-8 text-emerald-400" />,
    title: "Guided Case Solving",
    description: "Move from main problem to evidence, root causes, solutions, recommendation, justification, and final submission."
  }
];

const FeatureGrid = () => {
  return (
    <div className="py-24 bg-slate-900/50 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            A comprehensive suite of tools built specifically for handling complex, multi-layered regulatory and compliance case studies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-colors group"
            >
              <div className="mb-6 w-16 h-16 rounded-xl bg-slate-900/80 flex items-center justify-center shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
