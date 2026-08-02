import React from 'react';
import { useApp } from '../../context/AppContext';
import { HeartPulse, Sparkles, PhoneCall, MapPin, Send, Database } from 'lucide-react';

export const Footer = () => {
  const { setActiveView, setIsEmergencyModalOpen, dbConnected } = useApp();

  return (
    <footer className="bg-slate-950 border-t border-white/10 text-slate-400 text-xs py-12 px-4 lg:px-8 mt-16 w-full">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
        
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">MedConnect </span>
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-black text-lg">Karavali</span>
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Empowering Coastal Karnataka with AI-driven triage, real-time queue forecasting, instant report diagnostics, and direct specialist booking across Mangaluru, Udupi & Manipal.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-xl font-bold shadow-lg shadow-rose-500/20 text-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>108 Ambulance Hotline</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 border border-slate-800 px-2.5 py-1.5 rounded-xl bg-slate-900/60">
              <Database className={`w-3.5 h-3.5 ${dbConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="font-bold">{dbConnected ? 'PostgreSQL Connected' : 'Local Standby Mode'}</span>
            </div>
          </div>
        </div>

        {/* AI Features Column */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> AI Modules
          </h4>
          <ul className="space-y-2">
            <li><button onClick={() => setActiveView('ai-symptom-checker')} className="hover:text-cyan-400 transition-colors">AI Symptom Checker</button></li>
            <li><button onClick={() => setActiveView('medical-reports')} className="hover:text-cyan-400 transition-colors">Medical Report Analyzer</button></li>
            <li><button onClick={() => setActiveView('smart-recommendation')} className="hover:text-cyan-400 transition-colors">Smart Doctor Recommender</button></li>
            <li><button onClick={() => setActiveView('queue-prediction')} className="hover:text-cyan-400 transition-colors">Live Queue Predictor</button></li>
            <li><button onClick={() => setActiveView('ai-chatbot')} className="hover:text-cyan-400 transition-colors">24/7 AI Medical Assistant</button></li>
          </ul>
        </div>

        {/* Top Hospitals */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Karavali Hubs
          </h4>
          <ul className="space-y-2">
            <li><span className="text-slate-300">KMC Health City, Mangaluru</span></li>
            <li><span className="text-slate-300">Yenepoya Specialty Center</span></li>
            <li><span className="text-slate-300">AJ Hospital & Research</span></li>
            <li><span className="text-slate-300">Father Muller Medical Hub</span></li>
            <li><span className="text-slate-300">Kasturba Hospital, Manipal</span></li>
          </ul>
        </div>

        {/* Newsletter & Contact */}
        <div className="space-y-3">
          <h4 className="text-white font-bold text-sm tracking-wide">Health Updates</h4>
          <p className="text-[11px] text-slate-400">Receive verified medical tips & regional emergency alerts.</p>
          <div className="flex items-center gap-1">
            <input
              type="email"
              placeholder="Your email address"
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full"
            />
            <button className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-xl">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
        <p>© 2026 MedConnect Karavali. AI Healthcare Platform for Coastal Karnataka. All Rights Reserved.</p>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-300 cursor-pointer">Medical Disclaimer</span>
        </div>
      </div>
    </footer>
  );
};
