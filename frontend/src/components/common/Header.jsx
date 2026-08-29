import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeartPulse, Search, PhoneCall, LogIn, LogOut, Menu, X, Sparkles, Activity, ShieldCheck, User } from 'lucide-react';

export const Header = () => {
  const { role, activeView, setActiveView, notifications, setIsEmergencyModalOpen, currentUser, isAuthenticated, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('hosp') || q.includes('clinic') || q.includes('kmc') || q.includes('unity')) {
      setActiveView('hospitals');
    } else if (q.includes('report') || q.includes('pdf') || q.includes('blood')) {
      setActiveView('medical-reports');
    } else {
      setActiveView('doctors');
    }
    setSearchOpen(false);
  };

  const navLinks = [
    { id: 'doctors', label: 'Doctors' },
    { id: 'hospitals', label: 'Hospitals' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'medical-reports', label: 'Medical Reports' },
    { id: 'ai-symptom-checker', label: 'AI Health' },
  ];

  return (
    <header className="border-b border-slate-200/90 px-4 lg:px-8 py-3 sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* LEFT: Logo & Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => setActiveView(role === 'guest' ? 'landing' : role === 'patient' ? 'dashboard' : role === 'hospital' ? 'hospital-overview' : 'admin-overview')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-600 p-0.5 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg text-slate-900 tracking-tight">MedConnect</span>
                <span className="text-brand-600 font-black text-lg">Karavali</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wide">
                Smart Healthcare • Coastal Karnataka
              </p>
            </div>
          </div>
        </div>

        {/* CENTER: Navigation Links (Patient & Guest Only) */}
        {(role === 'patient' || role === 'guest') && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = activeView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveView(link.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* RIGHT: Search, Emergency SOS, Auth Buttons */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          
          {/* Quick Search Toggle / Input */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors, hospitals..."
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 w-44 focus:w-56 transition-all focus:outline-none focus:border-brand-500 font-semibold"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span className="hidden xl:inline">Search</span>
              </button>
            )}
          </div>

          {/* Emergency 108 Button */}
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency 108</span>
          </button>

          {/* Auth State Button */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView(currentUser.role === 'patient' ? 'profile' : 'login')}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-brand-300 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-800 transition-all"
              >
                <div className="w-5 h-5 rounded-lg bg-brand-600 text-white font-black text-[10px] flex items-center justify-center">
                  {currentUser.avatar || 'VP'}
                </div>
                <span>{currentUser.name?.split(' ')[0]}</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('login')}
                className="text-xs font-extrabold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveView('login')}
                className="bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>

        {/* MOBILE MENU TRIGGER */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 SOS</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-100 text-slate-800 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {role === 'doctor' ? (
              [
                { id: 'doctor-dashboard', label: 'OPD Clinic Queue' },
                { id: 'doctor-appointments', label: 'My Appointments' },
                { id: 'doctor-prescriptions', label: 'Issue Prescriptions' },
                { id: 'doctor-profile', label: 'Doctor Profile' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => { setActiveView(link.id); setMobileMenuOpen(false); }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-extrabold text-left hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {link.label}
                </button>
              ))
            ) : (role === 'patient' || role === 'guest') ? (
              navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { setActiveView(link.id); setMobileMenuOpen(false); }}
                  className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-extrabold text-left hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {link.label}
                </button>
              ))
            ) : null}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {isAuthenticated ? (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-xs font-extrabold text-rose-600">
                Sign Out
              </button>
            ) : (
              <button onClick={() => { setActiveView('login'); setMobileMenuOpen(false); }} className="w-full bg-brand-600 text-white text-xs font-extrabold py-2.5 rounded-xl">
                Sign In / Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
