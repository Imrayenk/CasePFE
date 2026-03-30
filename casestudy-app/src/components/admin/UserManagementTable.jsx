import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { UserCog, Search, Check, AlertCircle } from 'lucide-react';

const UserManagementTable = () => {
  const { usersDb, fetchUsersDb, updateUserRole, user: currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsersDb();
  }, [fetchUsersDb]);

  const handleRoleChange = (userId, newRole) => {
    if (userId === currentUser?.id) {
       alert("You cannot demote your own active account.");
       return;
    }
    updateUserRole(userId, newRole);
  };

  const filteredUsers = usersDb.filter(u => 
     u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
         <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <UserCog size={20} className="text-primary"/>
            Manage Permissions
         </h2>
         <div className="relative w-full sm:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
           <input 
             type="text" 
             placeholder="Search users..." 
             className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary text-slate-200 transition-colors"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wide">User Details</th>
              <th className="px-6 py-4 font-semibold tracking-wide">System Role</th>
              <th className="px-6 py-4 font-semibold text-right tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50 text-slate-300">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100 text-base">{user.name} {user.id === currentUser?.id ? <span className="text-primary ml-1 text-xs opacity-80">(You)</span> : ''}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="inline-flex items-center">
                     <select 
                        className={`bg-slate-900 border text-xs font-bold uppercase tracking-wider rounded-md px-3 py-2 cursor-pointer focus:outline-none transition-colors ${
                          user.role === 'admin' 
                            ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' 
                            : user.role === 'teacher'
                            ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                            : 'border-slate-600 text-slate-400 hover:border-slate-500'
                        }`}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUser?.id}
                     >
                       <option value="learner">Learner</option>
                       <option value="teacher">Teacher</option>
                       <option value="admin">Administrator</option>
                     </select>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.id === currentUser?.id ? (
                     <span className="text-xs text-slate-500 italic flex items-center justify-end gap-1">
                        <AlertCircle size={14}/> Active Session
                     </span>
                  ) : (
                     <span className="text-xs text-emerald-400/80 flex items-center justify-end gap-1 font-medium">
                        <Check size={14} /> Synced
                     </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementTable;
