import React, { useState } from 'react';
import AdminOverview from '../components/admin/AdminOverview';
import UserManagementTable from '../components/admin/UserManagementTable';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex-1 w-full bg-background-dark overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage users, system roles, and get an overview of the application.</p>
        </div>

        <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-full md:w-fit mb-8 shadow-inner">
          <button
             onClick={() => setActiveTab('overview')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
               activeTab === 'overview' 
                 ? 'bg-primary text-white shadow-md' 
                 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
             }`}
           >
             System Overview
           </button>
           <button
             onClick={() => setActiveTab('users')}
             className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
               activeTab === 'users' 
                 ? 'bg-primary text-white shadow-md' 
                 : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
             }`}
           >
             User Management
           </button>
        </div>

        <div>
          {activeTab === 'overview' && <AdminOverview />}
          {activeTab === 'users' && <UserManagementTable />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
