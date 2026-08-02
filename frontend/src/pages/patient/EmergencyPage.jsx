import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, PhoneCall, MapPin, Navigation, ShieldAlert, HeartPulse, Building2, ChevronRight } from 'lucide-react';

export const EmergencyPage = () => {
  const { hospitals, setIsEmergencyModalOpen } = useApp();

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* High Alert Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500/60 p-6 sm:p-8 rounded-3xl space-y-4 shadow-2xl shadow-red-500/20 text-center animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">EMERGENCY 108 RESPONSE</h1>
          <p className="text-xs sm:text-sm text-red-300 font-semibold mt-1">Priority Paramedic & ER Hospital Dispatcher</p>
        </div>

        <button
          onClick={() => setIsEmergencyModalOpen(true)}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-red-600/40 flex items-center justify-center gap-3 mx-auto"
        >
          <PhoneCall className="w-5 h-5" />
          <span>CALL AMBULANCE DISPATCH NOW (108)</span>
        </button>
      </div>

      {/* Emergency Hotline Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-slate-800 space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Coastal 108 Hotline</p>
          <p className="text-lg font-extrabold text-red-400">108 (Toll Free)</p>
          <p className="text-[10px] text-slate-500">24x7 Ambulance Dispatch</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">KMC Mangaluru ER</p>
          <p className="text-lg font-extrabold text-cyan-400">+91 824 244 5858</p>
          <p className="text-[10px] text-slate-500">Light House Hill Road</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Father Muller ER</p>
          <p className="text-lg font-extrabold text-emerald-400">+91 824 223 8000</p>
          <p className="text-[10px] text-slate-500">Kankanady Hub</p>
        </div>
      </div>

      {/* Nearest Emergency Hospitals */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
          <span>Nearest Emergency Trauma Centers</span>
          <span className="text-emerald-400 text-[10px] flex items-center gap-1"><Navigation className="w-3 h-3" /> Live GPS distance</span>
        </h3>

        <div className="space-y-3">
          {hospitals.map(hosp => (
            <div key={hosp.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {hosp.location} • <span className="text-cyan-300 font-semibold">{hosp.distance}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                  {hosp.bedsAvailable} ICU Beds
                </span>
                <p className="text-[10px] text-slate-400 mt-1">{hosp.phone}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
