import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Target } from 'lucide-react';

const Hero = ({ user }) => {
  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-md mb-8 text-sm font-medium text-slate-300">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Welcome to the future of learning
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8">
          Master Case Studies <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-500">
            With Intelligent Tools
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
          Map your concepts visually, leverage AI for deep analysis, and get real-time grading feedback to elevate your compliance understanding.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to={user ? "/dashboard" : "/signup"} 
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            {user ? "Go to Dashboard" : "Start Learning Now"}
            {user ? <ArrowRight size={20} /> : <Target size={20} className="ml-1" />}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
