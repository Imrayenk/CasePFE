import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Heart, MessageCircle, ArrowRight, BookOpen } from 'lucide-react';

const PopularCases = ({ user }) => {
  const { cases, socialData, fetchCases, fetchSocialData } = useStore();

  useEffect(() => {
    fetchCases();
    fetchSocialData();
  }, [fetchCases, fetchSocialData]);

  const popular = useMemo(() => {
    if (!cases || cases.length === 0) return [];
    
    return cases
      .filter(c => c.status === 'Active') // Only show active cases
      .map(c => {
        const social = socialData[c.id] || { likes: [], comments: [] };
        const score = social.likes.length * 2 + social.comments.length; 
        return { ...c, score, likes: social.likes.length, commentCount: social.comments.length };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Display top 3
  }, [cases, socialData]);

  if (popular.length === 0) return null;

  return (
    <div className="py-24 bg-background-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trending Case Studies
            </h2>
            <p className="text-slate-400 max-w-2xl text-lg">
              Explore the most discussed and analyzed compliance challenges currently active in the community.
            </p>
          </div>
          <Link to={user ? "/dashboard" : "/signup"} className="text-primary hover:text-primary-dark font-semibold flex items-center gap-2 transition-colors">
             View all cases <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popular.map((c) => (
            <div key={c.id} className="flex flex-col bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800/80 transition-all hover:-translate-y-1 overflow-hidden group">
              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                   <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-lg border border-primary/20">
                     Active Case
                   </span>
                   <BookOpen size={20} className="text-slate-500 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-3 line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                  {c.description || (c.content && c.content.length > 150 ? c.content.substring(0, 150) + "..." : c.content)}
                </p>
              </div>
              
              <div className="px-8 py-5 border-t border-slate-700/50 bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-400/80">
                    <Heart size={16} /> {c.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400/80">
                    <MessageCircle size={16} /> {c.commentCount}
                  </span>
                </div>
                <Link to={user ? `/workspace/${c.id}` : "/login"} className="text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Begin Analysis &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularCases;
