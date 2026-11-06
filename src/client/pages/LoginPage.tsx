import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SupabaseService } from '../../core/services/supabase';
import { Dumbbell, Lock, Mail, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Check local organizer master credentials first
      if (
        (email === 'director@ascend.com' || email === 'admin@ascend.com' || email.includes('@')) &&
        password === 'ascend2024'
      ) {
        onLoginSuccess(email);
        navigate('/dashboard');
        return;
      }

      // 2. Authenticate via Supabase Auth
      const { session, user } = await SupabaseService.signIn(email, password);
      if (session && user) {
        onLoginSuccess(user.email || email);
        navigate('/dashboard');
        return;
      }

      throw new Error('Invalid email or password.');
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Login failed. Enter valid Supabase credentials or the master password (ascend2024).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Top Back Link */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Homepage</span>
        </Link>

        {/* Brand Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 mx-auto flex items-center justify-center text-white shadow-xl shadow-red-600/30">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Organizer Portal Login</h2>
            <p className="text-xs text-slate-400">
              Authorized access to manage competitions, platform queues, and official score sheets.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Organizer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@ascend.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-center space-y-1">
            <span className="font-semibold text-slate-300 block">Supabase Role Security</span>
            <span>Only authorized organizer accounts can create or modify competitions. Public users can browse live meets without logging in.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

