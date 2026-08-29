import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export const DoctorLoginPage = () => {
  const { login, setActiveView } = useApp();

  const [email, setEmail] = useState('doctor@medconnect.com');
  const [password, setPassword] = useState('Doctor@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your professional doctor email/ID and password.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const ok = await login(email, password, 'doctor');
      if (ok) {
        setSuccess('Doctor authentication verified! Opening Clinical Dashboard...');
      } else {
        setError('Invalid doctor credentials. Please check your professional email and password.');
      }
    } catch (err) {
      setError(err.message || 'Doctor login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 py-8 relative overflow-hidden font-sans">
      
      {/* Decorative Subtle Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-brand-100/40 via-cyan-100/30 to-emerald-100/25 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="w-full max-w-md relative z-10">

        {/* Doctor Login Card */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 space-y-6">

          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold shadow-2xs">
              <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
              <span>MedConnect Karavali</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Doctor Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Access your clinical OPD schedule & patient records
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
            
            {/* Professional Email / ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Professional Email
              </label>
              <div className="relative flex items-center group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@medconnect.com"
                  className="glass-input text-xs w-full font-medium"
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
                  onClick={() => alert('Please contact your hospital system administrator to reset doctor portal credentials.')}
                  className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative flex items-center group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-brand-600 transition-colors absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="glass-input text-xs w-full font-medium"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-600 via-cyan-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all hover:shadow-xl active:scale-[0.99] cursor-pointer mt-2"
            >
              {isLoading ? (
                <span>Authenticating Doctor...</span>
              ) : (
                <>
                  <span>Sign In to Doctor Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Doctor Demo Logins */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-extrabold text-brand-700 flex items-center gap-1.5 text-[11px]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Available Doctor Accounts (Password: Doctor@2026)</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { setEmail('meera@medconnect.com'); setPassword('Doctor@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-brand-300 hover:text-brand-700 transition-all cursor-pointer shadow-2xs"
              >
                Dr. Meera (Father Muller)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('vignesh@medconnect.com'); setPassword('Doctor@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-brand-300 hover:text-brand-700 transition-all cursor-pointer shadow-2xs"
              >
                Dr. Vignesh (KMC)
              </button>
              <button
                type="button"
                onClick={() => { setEmail('santhosh@medconnect.com'); setPassword('Doctor@2026'); }}
                className="text-[10px] bg-white border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded-lg hover:border-brand-300 hover:text-brand-700 transition-all cursor-pointer shadow-2xs"
              >
                Dr. Santhosh (Kasturba)
              </button>
            </div>
          </div>

          {/* Switch to Patient Login */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium flex items-center justify-between">
            <span>Are you a patient?</span>
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
            >
              Go to Patient Portal →
            </button>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>🔒 Secure Doctor Access • ABDM Standards</span>
          </div>

        </div>

      </div>
    </div>
  );
};
