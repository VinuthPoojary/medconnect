import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Calendar, FileText, AlertTriangle, HeartPulse, Activity, MapPin, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export const PatientDashboard = () => {
  const { currentUser, patientProfile, appointments, reports, hospitals, setActiveView, setIsEmergencyModalOpen } = useApp();

  const upcomingApts = appointments.filter(a => a.status === 'upcoming');
  const healthScore = 92; // AI calculated score
  const displayName = currentUser?.name || patientProfile?.name || 'Patient';

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Card Banner */}
      <div className="glass-card p-6 sm:p-8 border-cyan-500/30 bg-gradient-to-r from-slate-900 via-brand-950/60 to-slate-900 relative overflow-hidden glow-blue">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Patient Portal
              </span>
              <span className="text-slate-400 text-xs">• {patientProfile.city}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, <span className="text-gradient">{displayName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Your overall AI Health Score is <span className="font-bold text-cyan-300">{healthScore}/100</span>. Blood sugar and ECG parameters are optimal. Next appointment in 2 days.
            </p>
          </div>

          {/* Quick Health Score Circular Widget */}
          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-slate-800" fill="transparent" />
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-cyan-400" strokeDasharray={163} strokeDashoffset={163 - (163 * healthScore) / 100} strokeLinecap="round" fill="transparent" />
              </svg>
              <span className="absolute font-extrabold text-sm text-white">{healthScore}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Health Score</p>
              <p className="text-[10px] text-emerald-400">Excellent Range</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveView('doctors')}
            className="glass-card glass-card-hover p-4 border-slate-800 text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white group-hover:text-cyan-400">Book Appointment</h4>
              <p className="text-[10px] text-slate-400">Find Karavali doctors</p>
            </div>
          </button>

          <button
            onClick={() => setActiveView('medical-reports')}
            className="glass-card glass-card-hover p-4 border-slate-800 text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white group-hover:text-emerald-400">Upload Report</h4>
              <p className="text-[10px] text-slate-400">AI PDF Analysis</p>
            </div>
          </button>

          <button
            onClick={() => setActiveView('ai-symptom-checker')}
            className="glass-card glass-card-hover p-4 border-cyan-500/30 text-left space-y-2 group bg-cyan-950/20"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white group-hover:text-cyan-300">Ask AI Triage</h4>
              <p className="text-[10px] text-cyan-400 font-semibold">Symptom Checker</p>
            </div>
          </button>

          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="glass-card p-4 border-red-500/40 text-left space-y-2 group bg-red-950/20 hover:border-red-500 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white group-hover:text-red-400">Emergency 108</h4>
              <p className="text-[10px] text-red-400 font-bold">Ambulance Dispatch</p>
            </div>
          </button>
        </div>
      </div>

      {/* Vitals Health Score Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">BMI Index</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{patientProfile.bmi}</p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Normal Weight
          </p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Blood Pressure</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{patientProfile.bloodPressure}</p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Optimal (Systolic)
          </p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Blood Sugar</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{patientProfile.sugar}</p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Normal Fasting
          </p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">Heart Rate</span>
            <HeartPulse className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{patientProfile.heartRate} <span className="text-xs font-normal text-slate-400">bpm</span></p>
          <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resting Pulse
          </p>
        </div>

      </div>

      {/* Main Row: Upcoming Appointments & AI Report Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Appointments Section (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" /> Upcoming Consultations ({upcomingApts.length})
            </h3>
            <button
              onClick={() => setActiveView('appointments')}
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingApts.map(apt => (
              <div key={apt.id} className="glass-card p-5 border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={apt.doctorPhoto} alt={apt.doctorName} className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {apt.specialization}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">{apt.doctorName}</h4>
                    <p className="text-xs text-slate-400">{apt.hospitalName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-cyan-400" /> {apt.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-400" /> {apt.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400">Queue Ticket</span>
                    <p className="text-xs font-extrabold text-cyan-400">#{apt.queueNumber} (Wait {apt.estimatedWaitTime})</p>
                  </div>
                  <button
                    onClick={() => setActiveView('appointments')}
                    className="bg-brand-600/80 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Health Tips Carousel Card */}
          <div className="glass-card p-6 border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Sparkles className="w-4 h-4" /> AI Health Recommendation of the Day
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Based on your coastal region profile, staying hydrated with tender coconut water and maintaining 7 hours of restorative sleep will help reduce resting heart rate by ~4 bpm.
            </p>
          </div>

        </div>

        {/* Right Sidebar Column: Recent Reports & Nearby Hospitals */}
        <div className="space-y-6">
          
          {/* Recent Reports Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Recent AI Reports
              </h3>
              <button onClick={() => setActiveView('medical-reports')} className="text-xs text-slate-400 hover:text-white">View</button>
            </div>

            <div className="space-y-2">
              {reports.slice(0, 2).map(rep => (
                <div key={rep.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl hover-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white truncate max-w-[180px]">{rep.title}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">AI Analyzed</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{rep.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Hospitals */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Nearby Super Specialty Hubs
            </h3>

            <div className="space-y-2">
              {hospitals.slice(0, 3).map(hosp => (
                <div key={hosp.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">{hosp.name}</h4>
                    <p className="text-[10px] text-slate-400">{hosp.location.split(',')[0]} • <span className="text-cyan-400 font-semibold">{hosp.distance}</span></p>
                  </div>
                  <button
                    onClick={() => setActiveView('hospitals')}
                    className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg hover:bg-cyan-500/20"
                  >
                    View Hub
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
