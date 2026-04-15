import React, { useState } from 'react';
import useStore from '../store/useStore';
import Hero from '../components/home/Hero';
import PopularCases from '../components/home/PopularCases';
import FeatureGrid from '../components/home/FeatureGrid';
import { BriefcaseMedical, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useStore();

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

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-background-dark flex flex-col w-full selection:bg-primary/30">
      
      {/* Public Navbar */}
      <header className="flex items-center justify-between border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary shadow-lg shadow-primary/20 text-white">
            <BriefcaseMedical size={24} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Case Workspace</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden pl-3 mr-2 hover:bg-slate-800 transition-colors cursor-pointer">
             <Globe size={16} className="text-slate-400" />
             <select 
                 value={language} 
                 onChange={handleLanguageChange}
                 className="bg-transparent text-sm font-semibold text-slate-200 border-none focus:ring-0 py-2 pl-2 pr-8 cursor-pointer outline-none"
             >
                 <option value="en" className="bg-slate-800 text-white">EN</option>
                 <option value="fr" className="bg-slate-800 text-white">FR</option>
                 <option value="ar" className="bg-slate-800 text-white">AR</option>
             </select>
          </div>
          {user ? (
            <Link 
              to="/dashboard" 
              className="hidden sm:flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-primary/20"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
              >
                Log In
              </Link>
              <Link 
                to="/signup" 
                className="flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-primary/20"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        <Hero user={user} />
        <PopularCases user={user} />
        <FeatureGrid />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-900 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center gap-4">
          <div className="flex gap-6 text-sm text-slate-400">
             <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
             <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            &copy; {new Date().getFullYear()} Case Workspace Application. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
