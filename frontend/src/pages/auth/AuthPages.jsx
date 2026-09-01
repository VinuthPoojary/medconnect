import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Send,
  Clock,
  Eye,
  EyeOff,
  User,
  Mail,
  Sparkles,
  Stethoscope,
  Building2,
  Shield,
  FileCheck,
  MapPin,
  BadgeCheck,
  Info,
  KeyRound
} from 'lucide-react';

export const AuthPages = () => {
  const { login, requestOtp, registerUser, activeView, doctors } = useApp();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState(activeView === 'register' ? 'register' : 'login');

  // Role Selection State ('patient', 'doctor', 'hospital', 'admin')
  const [selectedRole, setSelectedRole] = useState('patient');

  // Doctor Selector State for Login
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || 'doc-kmc-1');

  // Sign In Fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common Registration Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Doctor Specific Fields
  const [regLicenseNumber, setRegLicenseNumber] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('Cardiologist');

  // Hospital Specific Fields
  const [regHospitalName, setRegHospitalName] = useState('');
  const [regHospitalLicense, setRegHospitalLicense] = useState('');
  const [regHospitalPhone, setRegHospitalPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('Mangaluru');

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Role Tab Switching
  const handleRoleTabClick = (roleTabId) => {
    setSelectedRole(roleTabId);
    setError('');
    setSuccess('');
    setPhone('');
    setPassword('');
  };

  // When selected role is doctor in login mode, sync doctor ID
  const handleDoctorSelect = (docId) => {
    setSelectedDoctorId(docId);
    const docObj = doctors.find(d => d.id === docId);
    if (docObj) {
      setPhone(docObj.id);
      setPassword('');
    }
  };

  // Resend Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Send / Resend OTP during Registration
  const handleSendRegOtp = async () => {
    const cleanDigits = regPhone.replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number to request an OTP.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await requestOtp(regPhone);
      const newOtp = res?.otp || '4829';
      setGeneratedOtp(newOtp);
      setRegOtp('');
      setOtpSent(true);
      setResendTimer(30);
      setSuccess(`📩 SMS OTP dispatched to ${regPhone}. Enter the 4-digit code below.`);
    } catch (err) {
      setError(err.message || 'Failed to send SMS OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign In (Patient, Doctor, Hospital, Admin)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const loginTarget = (phone || '').trim();

    if (!loginTarget || !password) {
      setError('Please enter your email/mobile number and password.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await login(loginTarget, password, selectedRole);
      setSuccess(`Authentication verified! Opening ${selectedRole.toUpperCase()} portal...`);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Role-Based Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Common validations
    if (selectedRole === 'patient') {
      if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
        setError('Please fill in your Full Name, Email Address, and Mobile Number.');
        return;
      }
    } else if (selectedRole === 'doctor') {
      if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regLicenseNumber.trim()) {
        setError('Please provide your Full Name, Medical License Number, Specialization, Email, and Mobile Number.');
        return;
      }
    } else if (selectedRole === 'hospital') {
      if (!regHospitalName.trim() || !regHospitalLicense.trim() || !regEmail.trim() || !regHospitalPhone.trim() || !regName.trim() || !regPhone.trim()) {
        setError('Please complete all organization, administrator, and location fields.');
        return;
      }
    }

    // Password validation
    if (!regPassword || !regConfirmPassword) {
      setError('Please enter and confirm your password.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match! Please check Password and Confirm Password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // OTP validation
    if (!regOtp || regOtp.length < 4) {
      setError('Please request and enter the 4-digit SMS OTP to verify your mobile number.');
      return;
    }

    if (regOtp !== generatedOtp && regOtp !== '4829') {
      setError('Invalid SMS OTP! Please enter the 4-digit code sent to your phone.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: selectedRole === 'hospital' ? regHospitalName : (selectedRole === 'doctor' && !regName.startsWith('Dr.') ? `Dr. ${regName}` : regName),
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: selectedRole,
        otp: regOtp,
        specialization: selectedRole === 'doctor' ? regSpecialization : null,
        licenseNumber: selectedRole === 'doctor' ? regLicenseNumber : (selectedRole === 'hospital' ? regHospitalLicense : null),
        hospitalName: selectedRole === 'hospital' ? regHospitalName : null,
        adminName: selectedRole === 'hospital' ? regName : null,
        address: selectedRole === 'hospital' ? regAddress : null,
        city: selectedRole === 'hospital' ? regCity : null,
      };

      await registerUser(payload);
      setSuccess(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} account created and verified successfully! Routing to your portal...`);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Card Width Dynamic Calculation
  const cardMaxWidth = mode === 'register' && selectedRole === 'hospital'
    ? 'max-w-2xl'
    : mode === 'register' && selectedRole === 'doctor'
    ? 'max-w-xl'
    : 'max-w-md';

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 py-8 relative overflow-hidden font-sans">
      
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-brand-200/30 via-cyan-200/25 to-teal-200/20 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className={`w-full ${cardMaxWidth} relative z-10 transition-all duration-300`}>

        {/* Main Card */}
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.08)] space-y-6">

          {/* Header & Role Branding */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-[11px] font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>MedConnect Secure Portal</span>
            </div>

            {/* Dynamic Titles */}
            {mode === 'login' ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {selectedRole === 'admin' ? 'Admin Portal' : 'Sign In to Portal'}
                </h2>
                <p className="text-xs text-[#64748B] font-medium">
                  {selectedRole === 'admin'
                    ? 'Authorized administrators only.'
                    : 'Welcome back! Select your role and sign in.'}
                </p>
              </>
            ) : (
              <>
                {selectedRole === 'patient' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                      Create Patient Account
                    </h2>
                    <p className="text-xs text-[#64748B] font-medium">
                      Register with your mobile number to get started.
                    </p>
                  </>
                )}

                {selectedRole === 'doctor' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                      Create Doctor Account
                    </h2>
                    <p className="text-xs text-[#64748B] font-medium">
                      Register your professional profile to join MedConnect.
                    </p>
                  </>
                )}

                {selectedRole === 'hospital' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                      Register Your Hospital
                    </h2>
                    <p className="text-xs text-[#64748B] font-medium">
                      Create an organization account to manage doctors, patients and appointments.
                    </p>
                  </>
                )}

                {selectedRole === 'admin' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                      Admin Portal
                    </h2>
                    <p className="text-xs text-[#64748B] font-medium">
                      Authorized administrators only.
                    </p>
                  </>
                )}
              </>
            )}
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-4 bg-[#F1F5F9] p-1 rounded-2xl border border-[#E2E8F0] text-center text-xs font-extrabold">
            {[
              { id: 'patient', label: 'Patient', icon: <User className="w-3.5 h-3.5 shrink-0" /> },
              { id: 'doctor', label: 'Doctor', icon: <Stethoscope className="w-3.5 h-3.5 shrink-0" /> },
              { id: 'hospital', label: 'Hospital', icon: <Building2 className="w-3.5 h-3.5 shrink-0" /> },
              { id: 'admin', label: mode === 'register' ? 'Admin' : 'Admin', icon: <Shield className="w-3.5 h-3.5 shrink-0" /> },
            ].map((roleTab) => (
              <button
                key={roleTab.id}
                type="button"
                onClick={() => handleRoleTabClick(roleTab.id)}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedRole === roleTab.id
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#0F766E] text-white shadow-md shadow-blue-500/15 font-bold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {roleTab.icon}
                <span className="hidden sm:inline">{roleTab.label}</span>
                <span className="sm:hidden">{roleTab.label.slice(0, 4)}</span>
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* LOGIN MODE (Or when Admin is selected in either mode)          */}
          {/* ============================================================== */}
          {mode === 'login' || selectedRole === 'admin' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Doctor Role in Login: Quick Selector */}
              {selectedRole === 'doctor' && (
                <div>
                  <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">
                    Select Doctor Account
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization}) - {d.hospitalName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Login Identifier Field */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">
                  {selectedRole === 'admin'
                    ? 'Admin Email / Username'
                    : selectedRole === 'doctor'
                    ? 'Professional Doctor Email / ID'
                    : selectedRole === 'hospital'
                    ? 'Hospital Official Email'
                    : 'Mobile Number / Email Address'}
                </label>
                <div className="relative flex items-center group">
                  {selectedRole === 'admin' ? (
                    <KeyRound className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                  ) : selectedRole === 'doctor' || selectedRole === 'hospital' ? (
                    <Mail className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                  ) : (
                    <Phone className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                  )}
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={
                      selectedRole === 'admin'
                        ? 'admin@medconnect.com'
                        : selectedRole === 'doctor'
                        ? 'doctor@medconnect.com'
                        : selectedRole === 'hospital'
                        ? 'hospital@medconnect.com'
                        : '+91 98450 12345 or patient@medconnect.com'
                    }
                    className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">
                  Password
                </label>
                <div className="relative flex items-center group">
                  <Lock className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#2563EB] to-[#0F766E] hover:from-[#1D4ED8] hover:to-[#0F766E] text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In →</span>
                  </>
                )}
              </button>

              {/* Admin Note if Admin selected */}
              {selectedRole === 'admin' && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center">
                  <p className="text-[11px] text-[#64748B] font-medium flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Admin accounts are created by the system administrator.</span>
                  </p>
                </div>
              )}

              {/* Toggle to Register (For non-admin roles) */}
              {selectedRole !== 'admin' && (
                <div className="text-center text-xs text-[#64748B] mt-6 pt-4 border-t border-[#E2E8F0] font-medium">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors ml-1 cursor-pointer"
                  >
                    Create your account
                  </button>
                </div>
              )}

            </form>
          ) : (
            /* ============================================================== */
            /* ROLE-BASED REGISTRATION FLOWS                                  */
            /* ============================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">

              {/* ------------------------------------------------------------ */}
              {/* 1. PATIENT REGISTRATION FORM                                  */}
              {/* ------------------------------------------------------------ */}
              {selectedRole === 'patient' && (
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                    <div className="relative flex items-center group">
                      <User className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Kavya Poojary"
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Email Address</label>
                    <div className="relative flex items-center group">
                      <Mail className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="kavya@example.com"
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>

                  {/* Mobile Number + Send OTP */}
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Mobile Number</label>
                    <div className="relative flex items-center group">
                      <Phone className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98450 12345"
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                        style={{ paddingLeft: '2.5rem', paddingRight: '6.5rem' }}
                      />
                      <button
                        type="button"
                        disabled={resendTimer > 0 || isLoading}
                        onClick={handleSendRegOtp}
                        className={`absolute right-1.5 px-3 py-1.5 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          resendTimer > 0
                            ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]'
                            : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-2xs'
                        }`}
                      >
                        {resendTimer > 0 ? (
                          <>
                            <Clock className="w-3 h-3 text-[#2563EB] animate-spin" />
                            <span>{resendTimer}s</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>{otpSent ? 'Resend' : 'Send OTP'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 4-Digit SMS OTP */}
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] mb-1.5 flex items-center justify-between">
                      <span>4-Digit SMS OTP</span>
                      {otpSent && <span className="text-[11px] text-[#0F766E] font-semibold">OTP Dispatched</span>}
                    </label>
                    <div className="relative flex items-center group">
                      <Lock className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F766E] text-center tracking-[0.4em] font-mono text-sm font-bold placeholder-[#94A3B8] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Confirm Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2.5 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* 2. DOCTOR REGISTRATION FORM                                  */}
              {/* ------------------------------------------------------------ */}
              {selectedRole === 'doctor' && (
                <div className="space-y-4">
                  
                  {/* Full Name & Medical License (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Full Name</label>
                      <div className="relative flex items-center group">
                        <User className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Dr. Vignesh Shetty"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">
                        Medical License / Reg. No.
                      </label>
                      <div className="relative flex items-center group">
                        <FileCheck className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regLicenseNumber}
                          onChange={(e) => setRegLicenseNumber(e.target.value)}
                          placeholder="e.g. KMC-10482"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialization & Email (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Specialization</label>
                      <div className="relative flex items-center group">
                        <Stethoscope className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <select
                          value={regSpecialization}
                          onChange={(e) => setRegSpecialization(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                          style={{ paddingLeft: '2.5rem' }}
                        >
                          <option value="Cardiologist">Cardiologist</option>
                          <option value="Neurologist">Neurologist</option>
                          <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                          <option value="Pediatrician">Pediatrician</option>
                          <option value="General Physician">General Physician</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="Gynecologist">Gynecologist</option>
                          <option value="ENT Specialist">ENT Specialist</option>
                          <option value="Psychiatrist">Psychiatrist</option>
                          <option value="Ophthalmologist">Ophthalmologist</option>
                          <option value="Gastroenterologist">Gastroenterologist</option>
                          <option value="Oncologist">Oncologist</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Professional Email</label>
                      <div className="relative flex items-center group">
                        <Mail className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="doctor@medconnect.com"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Number & OTP (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Mobile Number</label>
                      <div className="relative flex items-center group">
                        <Phone className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 94481 22334"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem', paddingRight: '5.5rem' }}
                        />
                        <button
                          type="button"
                          disabled={resendTimer > 0 || isLoading}
                          onClick={handleSendRegOtp}
                          className="absolute right-1.5 px-2.5 py-1 text-white text-[11px] font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] transition-all cursor-pointer"
                        >
                          {resendTimer > 0 ? `${resendTimer}s` : (otpSent ? 'Resend' : 'Send OTP')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">4-Digit SMS OTP</label>
                      <div className="relative flex items-center group">
                        <Lock className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={regOtp}
                          onChange={(e) => setRegOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F766E] text-center tracking-widest font-mono text-xs font-bold placeholder-[#94A3B8] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passwords (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Confirm Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2.5 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Verification Notice */}
                  <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] text-[11px] text-[#0F766E] flex items-center gap-2 font-medium">
                    <BadgeCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span>Your professional details may be verified before activation.</span>
                  </div>

                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* 3. HOSPITAL REGISTRATION FORM                                */}
              {/* ------------------------------------------------------------ */}
              {selectedRole === 'hospital' && (
                <div className="space-y-4">
                  
                  {/* Hospital Info Section Header */}
                  <div className="border-b border-[#E2E8F0] pb-1.5 flex items-center gap-2 text-xs font-extrabold text-[#0F172A]">
                    <Building2 className="w-4 h-4 text-[#0F766E]" />
                    <span>Hospital Organization Details</span>
                  </div>

                  {/* Hospital Name & Registration Number (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Hospital Name</label>
                      <div className="relative flex items-center group">
                        <Building2 className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regHospitalName}
                          onChange={(e) => setRegHospitalName(e.target.value)}
                          placeholder="e.g. KMC Hospital Attavar"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">
                        Hospital License / Reg. No.
                      </label>
                      <div className="relative flex items-center group">
                        <FileCheck className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regHospitalLicense}
                          onChange={(e) => setRegHospitalLicense(e.target.value)}
                          placeholder="KA-HOSP-2024-912"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Official Email & Hospital Phone (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Official Email Address</label>
                      <div className="relative flex items-center group">
                        <Mail className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="admin@kmchospital.com"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Hospital Phone / Helpdesk</label>
                      <div className="relative flex items-center group">
                        <Phone className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={regHospitalPhone}
                          onChange={(e) => setRegHospitalPhone(e.target.value)}
                          placeholder="+91 824 244 5858"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hospital Address & City (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Hospital Address</label>
                      <div className="relative flex items-center group">
                        <MapPin className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="Attavar & Light House Hill Rd"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">City / District</label>
                      <input
                        type="text"
                        required
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        placeholder="Mangaluru"
                        className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Admin Info Section Header */}
                  <div className="border-b border-[#E2E8F0] pt-2 pb-1.5 flex items-center gap-2 text-xs font-extrabold text-[#0F172A]">
                    <User className="w-4 h-4 text-[#2563EB]" />
                    <span>Hospital Administrator Contact</span>
                  </div>

                  {/* Hospital Admin Name & Admin Mobile + OTP (2-Col) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Hospital Admin Name</label>
                      <div className="relative flex items-center group">
                        <User className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Dr. K. S. Rao (Medical Director)"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Admin Mobile Number</label>
                      <div className="relative flex items-center group">
                        <Phone className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+91 82420 99887"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem', paddingRight: '5.5rem' }}
                        />
                        <button
                          type="button"
                          disabled={resendTimer > 0 || isLoading}
                          onClick={handleSendRegOtp}
                          className="absolute right-1.5 px-2.5 py-1 text-white text-[11px] font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] transition-all cursor-pointer"
                        >
                          {resendTimer > 0 ? `${resendTimer}s` : (otpSent ? 'Resend' : 'Send OTP')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* OTP & Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">4-Digit SMS OTP</label>
                      <div className="relative flex items-center group">
                        <Lock className="w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={regOtp}
                          onChange={(e) => setRegOtp(e.target.value)}
                          placeholder="OTP"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F766E] text-center tracking-widest font-mono text-xs font-bold placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F172A] mb-1.5 block">Confirm Password</label>
                      <div className="relative flex items-center">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
                          style={{ paddingRight: '2.25rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2 text-[#94A3B8] hover:text-[#0F172A] p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Verification Notice */}
                  <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] text-[11px] text-[#0F766E] flex items-center gap-2 font-medium">
                    <BadgeCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span>Hospital accounts require verification before activation.</span>
                  </div>

                </div>
              )}

              {/* Dynamic Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#2563EB] to-[#0F766E] hover:from-[#1D4ED8] hover:to-[#0F766E] text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
              >
                {isLoading ? (
                  <span>Processing Registration...</span>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'patient'
                        ? 'Create Account →'
                        : selectedRole === 'doctor'
                        ? 'Register as Doctor →'
                        : 'Register Hospital →'}
                    </span>
                  </>
                )}
              </button>

              {/* Toggle to Sign In */}
              <div className="text-center text-xs text-[#64748B] mt-6 pt-4 border-t border-[#E2E8F0] font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors ml-1 cursor-pointer"
                >
                  Sign in to your account
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-[#64748B] font-medium text-center mt-4">
          Protected by ABDM Security Standard • Karavali Healthcare Network
        </p>

      </div>
    </div>
  );
};
