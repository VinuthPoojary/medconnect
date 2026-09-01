import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeartPulse, PhoneCall, LogOut, Menu, X } from 'lucide-react';

export const Header = () => {
  const { role, activeView, setActiveView, setIsEmergencyModalOpen, currentUser, isAuthenticated, requestSignOut } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPublicLanding = activeView === 'landing' || (!isAuthenticated && (activeView === 'login' || activeView === 'register'));

  // Nav links only for authenticated patient view
  const patientNavLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'doctors', label: 'Doctors' },
    { id: 'hospitals', label: 'Hospitals' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'medical-reports', label: 'Medical Reports' },
  ];

  return (
    <header className="border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* LEFT: Logo & Branding */}
        <div 
          onClick={() => setActiveView(isAuthenticated ? (role === 'doctor' ? 'doctor-dashboard' : role === 'hospital' ? 'hospital-overview' : role === 'admin' ? 'admin-overview' : 'dashboard') : 'landing')} 
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0 select-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0F766E] p-0.5 shadow-2xs group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-black text-base sm:text-lg text-[#0F172A] tracking-tight">MedConnect</span>
              <span className="text-[#2563EB] font-black text-base sm:text-lg">Karavali</span>
            </div>
            <p className="text-[10px] font-semibold text-[#64748B] hidden sm:block tracking-tight">
              Serving Coastal Karnataka
            </p>
          </div>
        </div>

        {/* CENTER: Navigation Links (Only shown when authenticated patient) */}
        {!isPublicLanding && isAuthenticated && role === 'patient' && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {patientNavLinks.map((link) => {
              const isActive = activeView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveView(link.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-[#2563EB] border border-blue-200/80 shadow-2xs'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* RIGHT: Actions (Emergency SOS, Sign In, Get Started, or User Profile) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Subtle Emergency 108 Hotline Action */}
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Emergency 108 Ambulance Hotline"
          >
            <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" />
            <span className="hidden xs:inline">108 SOS</span>
          </button>

          {/* Authenticated State */}
          {isAuthenticated && currentUser ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveView(currentUser.role === 'patient' ? 'profile' : 'dashboard')}
                className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-blue-300 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F172A] transition-all cursor-pointer"
              >
                <div className="w-5 h-5 rounded-lg bg-[#2563EB] text-white font-black text-[10px] flex items-center justify-center">
                  {currentUser.avatar || currentUser.name?.charAt(0) || 'U'}
                </div>
                <span className="truncate max-w-[100px]">{currentUser.name?.split(' ')[0]}</span>
              </button>

              <button
                onClick={requestSignOut}
                className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Unauthenticated / Landing View Actions */
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveView('login')}
                className="text-xs font-bold text-[#0F172A] hover:text-[#2563EB] px-3.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveView('register')}
                className="bg-gradient-to-r from-[#2563EB] to-[#0F766E] hover:from-[#1D4ED8] hover:to-[#0F766E] text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {/* MOBILE MENU TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-[#0F172A] hover:bg-slate-100 rounded-xl border border-[#E2E8F0] cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-3 pt-3 border-t border-[#E2E8F0] space-y-2 pb-1 animate-in fade-in duration-200">
          {isAuthenticated && currentUser ? (
            <div className="space-y-2">
              <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase">{currentUser.role}</span>
              </div>
              <button
                onClick={() => { requestSignOut(); setMobileMenuOpen(false); }}
                className="w-full text-center text-xs font-bold text-rose-600 py-2 rounded-xl hover:bg-rose-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { setActiveView('login'); setMobileMenuOpen(false); }}
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveView('register'); setMobileMenuOpen(false); }}
                className="w-full bg-gradient-to-r from-[#2563EB] to-[#0F766E] text-white text-xs font-bold py-2.5 rounded-xl shadow-xs"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
