import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  Calendar,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';

export const LandingPage = () => {
  const { setActiveView } = useApp();

  return (
    <div className="bg-[#F8FAFC] min-h-[calc(100vh-130px)] flex flex-col justify-between text-[#0F172A] overflow-x-hidden font-sans">
      
      {/* ===================================================================
          1. HERO SECTION
         =================================================================== */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 md:pt-20 pb-8 sm:pb-12 text-center flex flex-col items-center">
        
        {/* Small Brand Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2563EB] text-xs font-bold shadow-2xs mb-5">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>MedConnect Karavali</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.15] max-w-2xl mx-auto">
          Healthcare, <br />
          <span className="bg-gradient-to-r from-[#2563EB] to-[#0F766E] bg-clip-text text-transparent">
            connected to you.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-[#64748B] font-medium max-w-lg mx-auto leading-relaxed mt-4 sm:mt-5 px-2">
          Find healthcare services, connect with providers, and manage your appointments in one place.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7 sm:mt-8 w-full max-w-xs sm:max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveView('register')}
            className="w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-[#2563EB] to-[#0F766E] hover:from-[#1D4ED8] hover:to-[#0F766E] text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg active:scale-[0.99]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView('login')}
            className="w-full sm:w-auto min-w-[140px] bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] font-bold text-sm px-6 py-3.5 rounded-2xl shadow-2xs transition-all flex items-center justify-center cursor-pointer hover:border-slate-300 active:scale-[0.99]"
          >
            Sign In
          </button>
        </div>

        {/* Subtle Location Tag */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#64748B] mt-5 sm:mt-6">
          <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Serving Coastal Karnataka</span>
        </div>

      </section>

      {/* ===================================================================
          2. SMALL 3-BENEFIT SECTION (Minimal & Compact)
         =================================================================== */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Benefit 1: Easy Access */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] text-left flex flex-col justify-between space-y-2 hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] mb-1">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Easy Access</h3>
              <p className="text-xs text-[#64748B] font-medium mt-1 leading-normal">
                Access healthcare services from one place.
              </p>
            </div>
          </div>

          {/* Benefit 2: Appointments */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] text-left flex flex-col justify-between space-y-2 hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F766E] mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Appointments</h3>
              <p className="text-xs text-[#64748B] font-medium mt-1 leading-normal">
                Book and manage appointments easily.
              </p>
            </div>
          </div>

          {/* Benefit 3: Secure */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_rgba(15,23,42,0.04)] text-left flex flex-col justify-between space-y-2 hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Secure</h3>
              <p className="text-xs text-[#64748B] font-medium mt-1 leading-normal">
                Keep your healthcare information protected.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Spacing element to push minimal footer cleanly */}
      <div className="pb-4 sm:pb-8" />

    </div>
  );
};
