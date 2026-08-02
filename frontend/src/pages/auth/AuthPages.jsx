import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Stethoscope,
  Building2,
  Shield,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export const AuthPages = () => {
  const { login, loginWithOtp, registerUser, quickDemoLogin, activeView } = useApp();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState(activeView === 'register' ? 'register' : 'login');
  
  // Login Tab: 'email', 'otp', 'quick'
  const [loginTab, setLoginTab] = useState('email');

  // Form Fields
  const [email, setEmail] = useState('patient@medconnect.com');
  const [password, setPassword] = useState('MedConnect@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91 98450 12345');
  const [otp, setOtp] = useState('4829');

  // Register Fields (Patients Only)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit Email Login (Backend checks role automatically)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const ok = await login(email, password);
      if (ok) {
        setSuccess('Authentication successful! Routing to dashboard...');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP Login
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await loginWithOtp(phone, otp);
      setSuccess('Mobile OTP verified successfully!');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Registration (Patients Only)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await registerUser(regName, regEmail, regPhone, '', regPassword);
      setSuccess('Patient Account created successfully in Database!');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl space-y-6">

        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>MedConnect Karavali Portal</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Patient Registration'}
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {mode === 'login'
              ? 'Sign in with your email & password. The system will automatically route you to your Dashboard.'
              : 'Create a new Patient account for Coastal Karnataka AI Healthcare Network.'}
          </p>
        </div>

        {/* Main Auth Form Box */}
        <div className="glass-card p-6 sm:p-8 border-slate-800 bg-slate-900/90 shadow-2xl relative">
          
          {/* Main Mode Toggle: Sign In vs Register (Patients Only) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account (Patient)
              </button>
            </div>

            {mode === 'register' && (
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Patient Account Only
              </span>
            )}
          </div>

          {/* Feedback Alert Banners */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN MODE */}
          {mode === 'login' ? (
            <div className="space-y-6">
              
              {/* Login Method Sub-Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLoginTab('email')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginTab === 'email' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('otp')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginTab === 'otp' ? 'bg-slate-800 text-cyan-300 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => setLoginTab('quick')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    loginTab === 'quick' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> 1-Click Demo
                </button>
              </div>

              {/* TAB 1: Email & Password Form */}
              {loginTab === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. patient@medconnect.com"
                        className="glass-input pl-10 text-xs w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input pl-10 pr-10 text-xs w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Test Credentials Helper Box */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="font-bold text-cyan-400">💡 Test Credentials (Auto-checks role in database):</p>
                    <p>Patient: <code className="text-white bg-slate-900 px-1 rounded">patient@medconnect.com</code></p>
                    <p>Doctor: <code className="text-white bg-slate-900 px-1 rounded">doctor@medconnect.com</code></p>
                    <p>Hospital: <code className="text-white bg-slate-900 px-1 rounded">hospital@medconnect.com</code></p>
                    <p>Admin: <code className="text-white bg-slate-900 px-1 rounded">admin@medconnect.com</code></p>
                    <p>Password: <code className="text-white bg-slate-900 px-1 rounded">MedConnect@2026</code></p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* TAB 2: Mobile OTP Form */}
              {loginTab === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="glass-input pl-10 text-xs w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                      Enter 4-Digit SMS OTP
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="glass-input text-center tracking-[1em] text-lg font-mono font-bold w-full text-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {isLoading ? 'Verifying OTP...' : 'Verify OTP & Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* TAB 3: 1-Click Quick Demo Login */}
              {loginTab === 'quick' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-300 text-center mb-3">
                    Click any role below to test dashboard routing instantly:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => quickDemoLogin('patient')}
                      className="glass-card glass-card-hover p-4 border-cyan-500/40 text-left space-y-1 group bg-cyan-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-cyan-400" /> Patient Demo
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400">Routes to Patient Dashboard</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickDemoLogin('doctor')}
                      className="glass-card glass-card-hover p-4 border-emerald-500/40 text-left space-y-1 group bg-emerald-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white group-hover:text-emerald-300 flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-emerald-400" /> Doctor Demo
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400">Routes to Doctor Dashboard</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickDemoLogin('hospital')}
                      className="glass-card glass-card-hover p-4 border-brand-500/40 text-left space-y-1 group bg-brand-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white group-hover:text-brand-300 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-brand-400" /> Hospital Admin Demo
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-brand-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400">Routes to Hospital Dashboard</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickDemoLogin('admin')}
                      className="glass-card glass-card-hover p-4 border-amber-500/40 text-left space-y-1 group bg-amber-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-white group-hover:text-amber-300 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-amber-400" /> Platform Admin Demo
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400">Routes to Admin Dashboard</p>
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* CREATE PATIENT ACCOUNT MODE */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rajesh Poojary"
                  className="glass-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rajesh@example.com"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98450 99999"
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Set Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input text-xs w-full"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? 'Creating Account...' : 'Register Patient Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-slate-400 text-center">
          Protected by ABDM ABHA Encryption Standard • Karavali Healthcare Network
        </p>

      </div>
    </div>
  );
};

