import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import { Users, FileText, Database, Activity } from 'lucide-react';

const AdminOverview = () => {
  const { usersDb, cases, fetchUsersDb, fetchCases } = useStore();

  useEffect(() => {
    fetchUsersDb();
    fetchCases();
  }, [fetchUsersDb, fetchCases]);

  const stats = [
    {
      label: "Total Registered Users",
      value: usersDb?.length || 0,
      icon: <Users size={24} className="text-blue-400" />,
      color: "bg-blue-400/20 border-blue-400/30"
    },
    {
      label: "Total Case Studies",
      value: cases?.length || 0,
      icon: <FileText size={24} className="text-purple-400" />,
      color: "bg-purple-400/20 border-purple-400/30"
    },
    {
       label: "System Status",
       value: "Healthy",
       icon: <Activity size={24} className="text-emerald-400" />,
       color: "bg-emerald-400/20 border-emerald-400/30"
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-5 shadow-sm hover:bg-slate-800/60 transition-colors">
            <div className={`flex items-center justify-center size-14 rounded-xl border ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
               <p className="text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
               <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-sm">
         <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Database size={20} className="text-primary"/> 
            Recent System Activity
         </h2>
         <div className="text-slate-400 p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
            <Activity size={32} className="mx-auto mb-3 opacity-50" />
            <p>More complex analytics and activity streams are planned for v2.</p>
         </div>
      </div>
    </div>
  );
};

export default AdminOverview;
