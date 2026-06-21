import { Activity, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignup) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || (isSignup ? 'Unable to create account.' : 'Unable to sign in. Check credentials.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4 text-ink">
      <form onSubmit={handleSubmit} className="card-surface animate-in w-full max-w-md p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded bg-slate-950 text-white dark:bg-cyan-500"><Activity /></div>
          <div>
            <p className="page-kicker">TrendWatch</p>
            <h1 className="text-2xl font-semibold">{isSignup ? 'Create Account' : 'Sign in'}</h1>
          </div>
        </div>
        
        <div className="mb-6 flex gap-2">
          <button type="button" onClick={() => setIsSignup(false)} className={`flex-1 rounded px-3 py-2 font-medium ${!isSignup ? 'bg-slate-950 text-white dark:bg-cyan-500' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
            Sign In
          </button>
          <button type="button" onClick={() => setIsSignup(true)} className={`flex-1 rounded px-3 py-2 font-medium ${isSignup ? 'bg-slate-950 text-white dark:bg-cyan-500' : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>
            Sign Up
          </button>
        </div>

        {isSignup && (
          <label className="mb-4 block text-sm font-medium">
            Full Name
            <span className="relative mt-2 block">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input placeholder="Your name" className="field w-full pl-10" value={name} onChange={(e) => setName(e.target.value)} required={isSignup} />
            </span>
          </label>
        )}

        <label className="mb-4 block text-sm font-medium">
          Email
          <span className="relative mt-2 block">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="email" placeholder="you@example.com" className="field w-full pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </span>
        </label>
        
        <label className="mb-5 block text-sm font-medium">
          Password
          <span className="relative mt-2 block">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="password" placeholder={isSignup ? 'At least 8 characters' : 'Your password'} className="field w-full pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isSignup ? 8 : 6} />
          </span>
        </label>
        
        {error && <p className="mb-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        
        <button disabled={loading} className="btn-primary h-11 w-full">
          {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create Account' : 'Open Dashboard')}
        </button>
      </form>
    </main>
  );
}
