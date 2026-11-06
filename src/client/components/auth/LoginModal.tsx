import React, { useState } from 'react';
import { ShieldCheck, LogIn, Lock, Mail, CheckCircle2, User, X } from 'lucide-react';
import { SupabaseAdapter } from '../../../core/services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOrganizer: boolean;
  onSetOrganizer: (isOrg: boolean, userEmail?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isOrganizer,
  onSetOrganizer,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (roleName: string) => {
    onSetOrganizer(true, roleName);
    onClose();
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Connect to Supabase Auth endpoint
      const res = await fetch(`${SupabaseAdapter['url']}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: SupabaseAdapter['key'],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error_description || data.msg || 'Authentication failed');
      }

      const data = await res.json();
      onSetOrganizer(true, data.user?.email || email);
      onClose();
    } catch (err: any) {
      // If Supabase user isn't created yet, offer quick local login
      setErrorMsg(err.message || 'Login failed. You can also use Quick Organizer Login below.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onSetOrganizer(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Organizer Authentication</h3>
            <p className="text-xs text-slate-400">Manage participants, platform queue & decisions</p>
          </div>
        </div>

        {isOrganizer ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center space-x-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block text-sm">Organizer Mode Active</span>
                You have full authority to record lifts, manage participants, and adjust rules.
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Sign Out (Spectator View)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-600/30 transition"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Quick 1-Click Organizer Login */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Meet Access
              </span>
              <button
                type="button"
                onClick={() => handleQuickLogin('director@ascend.com')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log in as Meet Organizer / Director</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                One-click instant access to manage the platform, record attempts, and delete participants.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase">
                Or Supabase Credentials
              </span>
            </div>

            {/* Supabase Email/Password Form */}
            <form onSubmit={handleSupabaseLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Organizer Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@ascend.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition"
              >
                {loading ? 'Authenticating...' : 'Sign In with Supabase'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

