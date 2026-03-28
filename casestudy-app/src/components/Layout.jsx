import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { Bell, UserCircle, BriefcaseMedical, X, LogOut } from 'lucide-react';

const Layout = () => {
  const { user, currentCase, signOut, notifications, markNotificationsAsRead, clearNotifications, avatars } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isWorkspace = location.pathname.includes('/workspace');

  const [showNotifications, setShowNotifications] = useState(false);

  // Filter notifications for the current user (or system defaults for unauth)
  const currentUserId = user?.id || 'system';
  const userNotifications = notifications.filter(n => n.userId === currentUserId || !n.userId);

  return (
    <div className="flex flex-col h-screen w-full bg-background-dark text-slate-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3 shrink-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-white">
              <BriefcaseMedical size={20} />
            </div>
            <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight">Case Workspace</h2>
          </Link>
          
          {isWorkspace && currentCase && (
            <>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-sm font-medium">Case #{currentCase.id}</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
                <span className="text-sm font-semibold text-primary">{currentCase.title}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 relative">
            <button 
              onClick={() => {
                 const willShow = !showNotifications;
                 setShowNotifications(willShow);
                 if (willShow) markNotificationsAsRead();
              }}
              className={`flex items-center justify-center rounded-lg size-10 relative transition-colors ${showNotifications ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <Bell size={18} />
              {userNotifications.filter(n => !n.read).length > 0 && (
                 <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full animate-pulse"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-12 right-12 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                  <h3 className="font-bold text-slate-200">Notifications</h3>
                  {userNotifications.filter(n => !n.read).length > 0 && (
                     <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">{userNotifications.filter(n => !n.read).length} New</span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar bg-slate-800">
                  {userNotifications.length === 0 ? (
                      <div className="p-6 flex flex-col items-center justify-center text-slate-500">
                          <Bell size={24} className="mb-2 opacity-50"/>
                          <p className="text-sm">No new notifications</p>
                      </div>
                  ) : (
                      userNotifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${!n.read ? 'bg-slate-800/50' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className={`text-sm font-semibold ${!n.read ? 'text-slate-100' : 'text-slate-300'}`}>{n.title}</p>
                                {!n.read && <span className="size-1.5 bg-primary rounded-full mt-1.5"></span>}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium">{new Date(n.time).toLocaleString()}</p>
                          </div>
                      ))
                  )}
                </div>
                {userNotifications.length > 0 && (
                  <div className="p-2 border-t border-slate-700 bg-slate-800/50 flex justify-center">
                    <button onClick={clearNotifications} className="text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-wider py-1 px-4">
                        Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link to="/profile" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors">
             <span className="text-sm font-semibold px-2 text-slate-200 uppercase tracking-wide">{user?.name}</span>
             <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden text-primary shrink-0">
               {user?.id && avatars?.[user.id] ? (
                   <img src={avatars[user.id]} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                   <UserCircle size={24} />
               )}
             </div>
          </Link>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
