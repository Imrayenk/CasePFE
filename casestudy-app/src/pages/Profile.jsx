import React, { useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ShieldCheck, Save, LogOut, Settings, Moon, Globe, Camera } from 'lucide-react';

const Profile = () => {
  const { user, updateProfileName, signOut, isDarkMode, toggleDarkMode, avatars, updateAvatar } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert('Image must be less than 2MB');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
          updateAvatar(user.id, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return match[2];
  };

  const [language, setLanguage] = useState(() => {
    const googtrans = getCookie('googtrans');
    if (googtrans) {
      return googtrans.split('/')[2] || 'en';
    }
    return 'en';
  });

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const host = window.location.hostname;
    if (newLang === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${host}; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${host}; path=/;`;
    } else {
        document.cookie = `googtrans=/en/${newLang}; path=/;`;
        document.cookie = `googtrans=/en/${newLang}; domain=${host}; path=/;`;
        document.cookie = `googtrans=/en/${newLang}; domain=.${host}; path=/;`;
    }
    window.location.reload();
  };

  const handleSave = () => {
      updateProfileName(editName);
      setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-dark min-h-full">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-3">
                <User className="text-primary"/> My Profile
            </h1>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl flex flex-col gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-slate-800">
                <div className="relative group">
                    <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl font-bold text-slate-400 overflow-hidden shadow-lg">
                        {avatars?.[user.id] ? (
                            <img src={avatars[user.id]} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-lg border-2 border-slate-900 hover:scale-110 hover:bg-primary/90 transition-all z-10"
                        title="Change Profile Picture"
                    >
                        <Camera size={14} />
                    </button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    <p className="text-slate-400 font-medium capitalize flex items-center justify-center md:justify-start gap-1.5 mt-1">
                        <ShieldCheck size={16} className={user.role === 'teacher' ? 'text-amber-500' : 'text-primary'}/> 
                        {user.role} Account
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Account Details</h3>
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 space-y-5">
                       
                       <div className="flex flex-col gap-1.5">
                           <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                               <Mail size={14}/> EMAIL ADDRESS
                           </label>
                           <div className="text-slate-200 font-medium px-1">
                               {user.email}
                           </div>
                       </div>

                       <div className="flex flex-col gap-1.5">
                           <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                               <ShieldCheck size={14}/> SYSTEM ROLE
                           </label>
                           <div className="flex mt-1">
                               <span className={`px-3 py-1 bg-slate-800 border rounded-lg text-xs font-bold uppercase tracking-wider ${user.role === 'teacher' ? 'border-amber-500/30 text-amber-500' : 'border-primary/30 text-primary'}`}>
                                    {user.role}
                               </span>
                           </div>
                       </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Profile Identity</h3>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                                Edit Name
                            </button>
                        )}
                    </div>
                    <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 space-y-5">
                       
                       <div className="flex flex-col gap-1.5">
                           <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                               <User size={14}/> DISPLAY NAME
                           </label>
                           
                           {isEditing ? (
                               <div className="flex items-center gap-2 mt-1">
                                   <input 
                                       type="text" 
                                       value={editName}
                                       onChange={e => setEditName(e.target.value)}
                                       className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                                   />
                                   <button onClick={handleSave} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                                       <Save size={16}/>
                                   </button>
                               </div>
                           ) : (
                               <div className="text-slate-200 font-medium px-1 py-1">
                                   {user.name}
                               </div>
                           )}
                       </div>
                       
                       <p className="text-xs text-slate-500 leading-relaxed mt-2">
                           Your display name is visible to {user.role === 'teacher' ? 'learners when they review case feedback' : 'instructors when grading your case studies'}.
                       </p>
                    </div>
                </div>

            </div>

            {/* System Settings Section */}
            <div className="pt-8 border-t border-slate-800 space-y-4">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                   <Settings size={16} className="text-primary"/> System Settings
               </h3>
               
               <div className="grid md:grid-cols-3 gap-4 lg:gap-8">
                   <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Globe size={14}/> LANGUAGE</h4>
                       <div className="flex items-center justify-between bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                           <select 
                               value={language} 
                               onChange={handleLanguageChange}
                               className="w-full bg-transparent text-sm font-medium text-slate-200 border-none focus:ring-0 py-2.5 px-3 cursor-pointer outline-none"
                           >
                               <option value="en" className="bg-slate-800 text-white">English</option>
                               <option value="fr" className="bg-slate-800 text-white">Français</option>
                               <option value="ar" className="bg-slate-800 text-white">العربية</option>
                           </select>
                       </div>
                   </div>

                   <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 space-y-4">
                       <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Moon size={14}/> APPEARANCE</h4>
                       <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                         <span className="text-sm font-medium text-slate-200">Dark Mode</span>
                         <div onClick={toggleDarkMode} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-primary' : 'bg-slate-600'}`}>
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                         </div>
                       </div>
                   </div>

                   <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/50 space-y-4 flex flex-col justify-center">
                       <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><LogOut size={14}/> SESSIONS</h4>
                       <button onClick={() => { signOut(); navigate('/login'); }} className="w-full text-left p-3 text-sm font-medium text-red-400 bg-red-900/10 rounded-lg hover:bg-red-900/20 border border-slate-700/50 transition-colors flex items-center gap-2 justify-center">
                           <LogOut size={16}/> Sign Out of Account
                       </button>
                   </div>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
