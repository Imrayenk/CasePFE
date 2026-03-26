import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { BriefcaseMedical, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signIn(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const result = await useStore.getState().signInWithGoogle();
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="flex h-screen bg-background-dark items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/20 text-primary border border-primary/30">
              <BriefcaseMedical size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-slate-400 text-sm mt-1">Sign in to your learning workspace</p>
            </div>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && <div className="p-3 bg-rose-900/30 border border-rose-900/50 rounded-lg text-rose-400 text-sm text-center font-medium">{error}</div>}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-500"
              placeholder="e.g. learner@test.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input 
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <LogIn size={18}/> Sign In
          </button>
        </form>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">or continue with</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button" 
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.52 1 10.21 1 12s.43 3.48 1.18 4.97l3.69-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline font-bold">Register here</Link>
        </div>
        
        <div className="text-center text-xs text-slate-500">
           <strong>Demo Accounts:</strong><br/>
           learner@test.com / password<br/>
           teacher@test.com / password
        </div>
      </div>
    </div>
  );
};

export default Login;
