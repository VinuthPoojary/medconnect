import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Hospital
} from 'lucide-react';

export const HospitalLoginPage = () => {
  const { login, setActiveView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your hospital email and password.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const ok = await login(email.trim(), password, 'hospital');
      if (ok) {
        setSuccess('Hospital authentication verified! Opening Hospital Dashboard...');
      } else {
        setError('Invalid hospital email or password.');
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-3 sm:p-4 py-8 relative overflow-hidden font-sans">
      
      {/* Decorative Subtle Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[520px] h-[320px] sm:h-[520px] bg-gradient-to-tr from-emerald-100/40 via-teal-100/30 to-cyan-100/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="w-full max-w-md relative z-10">

        {/* Hospital Login Card */}
        <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 space-y-5 sm:space-y-6">

          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
              <Hospital className="w-3.5 h-3.5 text-emerald-600" />
              <span>MedConnect Karavali</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hospital Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Sign in to manage your hospital's healthcare services.
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-2xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Hospital Email */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Hospital Email
              </label>
              <div className="relative flex items-center group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kmchospital@medconnectkaravali.com"
                  className="glass-input text-xs sm:text-sm w-full font-medium"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact the Karavali Health Administration at admin@medconnect.com for credential assistance.')}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative flex items-center group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-input text-xs sm:text-sm w-full font-medium"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-[0.99] cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Authenticating Hospital...</span>
              ) : (
                <>
                  <span>Sign In →</span>
                </>
              )}
            </button>

          </form>

          {/* Quick Existing Hospital Logins for Testing */}
          <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-extrabold text-emerald-800 flex items-center gap-1.5 text-[11px]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Existing Hospital Accounts</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { setEmail('kmchospital@medconnectkaravali.com'); setPassword('MedConnect@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                KMC Hospital
              </button>
              <button
                type="button"
                onClick={() => { setEmail('ajhospital-002@medconnectkaravali.com'); setPassword('MedConnect@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                AJ Hospital
              </button>
              <button
                type="button"
                onClick={() => { setEmail('kasturbahospital-002@medconnectkaravali.com'); setPassword('MedConnect@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                Kasturba Hospital
              </button>
              <button
                type="button"
                onClick={() => { setEmail('fathermullermedicalcollegehospital-002@medconnectkaravali.com'); setPassword('MedConnect@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
              >
                Father Muller
              </button>
            </div>
          </div>

          {/* Switch to Patient / Doctor */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium flex items-center justify-between">
            <span>Are you a patient?</span>
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Patient Sign In →
            </button>
          </div>

          {/* Authorization Notice & Security Badge */}
          <div className="text-center space-y-1 pt-1">
            <p className="text-[11px] font-semibold text-slate-400">
              Authorized hospital accounts only.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>🔒 ABDM Verified Healthcare Network</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
