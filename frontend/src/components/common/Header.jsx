import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, Bell, PhoneCall, Sparkles, Menu, X, HeartPulse, LogOut, LogIn } from 'lucide-react';

export const Header = () => {
  const { role, activeView, setActiveView, notifications, setIsEmergencyModalOpen, currentUser, isAuthenticated, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="glass-nav border-b border-white/10 px-4 lg:px-6 py-3 sticky top-0 z-40 w-full">
      <div className="w-full flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveView(role === 'guest' ? 'landing' : role === 'patient' ? 'dashboard' : role === 'hospital' ? 'hospital-overview' : 'admin-overview')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">MedConnect</span>
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-black text-xl">Karavali</span>
              <span className="text-[10px] font-semibold bg-brand-500/20 text-cyan-300 border border-brand-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Smart Healthcare Platform • Coastal Karnataka</p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="hidden md:flex items-center gap-4">

          {/* Quick AI Shortcuts */}
          {role === 'patient' && (
            <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveView('ai-symptom-checker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeView === 'ai-symptom-checker' 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                Symptom Checker
              </button>
              <button
                onClick={() => setActiveView('ai-chatbot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeView === 'ai-chatbot' 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                AI Assistant
              </button>
            </div>
          )}

          {/* Emergency 108 SOS Button */}
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-500/25 animate-pulse transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>108 SOS</span>
          </button>

          {/* Notification Icon */}
          <button
            onClick={() => setActiveView('notifications')}
            className="relative p-2 text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-white/10 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Authenticated Profile Avatar & Logout */}
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView(currentUser.role === 'patient' ? 'profile' : 'login')}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 pl-2 pr-3 py-1 rounded-xl text-xs text-slate-200 transition-all group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                  {currentUser.avatar || 'KP'}
                </div>
                <span className="hidden lg:inline font-medium group-hover:text-cyan-400 transition-colors">
                  {currentUser.name}
                </span>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-white/10 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveView('login')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md hover:scale-105 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>

        {/* Mobile menu trigger button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="bg-red-600 text-white p-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1"
          >
            <PhoneCall className="w-4 h-4" />
            <span className="text-[11px]">108</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 pb-2">
          {role === 'patient' && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }} className="bg-slate-900 text-slate-200 p-2 rounded-xl text-xs text-left">Dashboard</button>
              <button onClick={() => { setActiveView('appointments'); setMobileMenuOpen(false); }} className="bg-slate-900 text-slate-200 p-2 rounded-xl text-xs text-left">Appointments</button>
              <button onClick={() => { setActiveView('ai-symptom-checker'); setMobileMenuOpen(false); }} className="bg-brand-950/60 text-cyan-300 border border-brand-500/30 p-2 rounded-xl text-xs text-left flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Triage</button>
              <button onClick={() => { setActiveView('ai-chatbot'); setMobileMenuOpen(false); }} className="bg-slate-900 text-slate-200 p-2 rounded-xl text-xs text-left flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" /> AI Assistant</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
