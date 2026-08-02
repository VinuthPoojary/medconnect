import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, PhoneCall, MapPin, X, CheckCircle2, Navigation } from 'lucide-react';

export const EmergencyModal = () => {
  const { isEmergencyModalOpen, setIsEmergencyModalOpen, hospitals } = useApp();
  const [isDispatched, setIsDispatched] = useState(false);

  if (!isEmergencyModalOpen) return null;

  const handleDispatch = () => {
    setIsDispatched(true);
    setTimeout(() => {
      // Auto reset after 10 sec if needed
    }, 10000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500/50 w-full max-w-xl rounded-3xl p-6 shadow-2xl shadow-red-500/20 relative animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button
          onClick={() => { setIsEmergencyModalOpen(false); setIsDispatched(false); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 animate-pulse">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              KARAVALI EMERGENCY 108 SOS
            </h2>
            <p className="text-xs text-red-400 font-semibold">Priority Medical Triage & Ambulance Dispatch</p>
          </div>
        </div>

        {!isDispatched ? (
          <div className="space-y-6">
            <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-2xl">
              <p className="text-xs text-slate-200 leading-relaxed">
                If you or someone nearby is experiencing acute chest pain, severe trauma, stroke symptoms, or breathing difficulty, request immediate paramedic support.
              </p>
            </div>

            {/* Big SOS Call Button */}
            <div className="text-center py-2">
              <button
                onClick={handleDispatch}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-lg py-4 rounded-2xl shadow-xl shadow-red-600/40 flex items-center justify-center gap-3 animate-pulse transition-all"
              >
                <PhoneCall className="w-6 h-6" />
                <span>DISPATCH AMBULANCE NOW (108)</span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2">Free emergency line active across Dakshina Kannada & Udupi</p>
            </div>

            {/* Nearest ER Hospitals */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Nearest ER Emergency Hubs</span>
                <span className="text-emerald-400 text-[10px] font-normal flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Live GPS Tracking
                </span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {hospitals.map(hosp => (
                  <div key={hosp.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-white">{hosp.name}</h5>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" /> {hosp.location.split(',')[0]} • <span className="text-cyan-300 font-semibold">{hosp.distance}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {hosp.bedsAvailable} ICU Beds
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{hosp.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ambulance Unit Dispatched!</h3>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">Unit #DK-108-KA09 is en route to your GPS location.</p>
              <p className="text-xs text-slate-300 mt-3 max-w-sm mx-auto">
                Estimated arrival: <span className="font-bold text-white">4 minutes</span>. Stay calm. The ER doctor team has been alerted.
              </p>
            </div>
            <button
              onClick={() => { setIsEmergencyModalOpen(false); setIsDispatched(false); }}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-6 py-2 rounded-xl mt-4"
            >
              Close Alert
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
