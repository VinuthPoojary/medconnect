import React from 'react';
import { useApp } from '../../context/AppContext';
import { PatientQueueTracker } from '../../components/ui/PatientQueueTracker';
import {
  Sparkles,
  Calendar,
  FileText,
  AlertTriangle,
  HeartPulse,
  Activity,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Building2,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const PatientDashboard = () => {
  const { currentUser, patientProfile, appointments, reports, hospitals, doctors, setActiveView, setIsEmergencyModalOpen } = useApp();

  const activeStatuses = ['upcoming', 'booked', 'waiting', 'in_consultation'];
  const upcomingApts = appointments.filter(a => activeStatuses.includes(a.status?.toLowerCase()));
  const healthScore = 92;
  
  // Display name formatting
  const rawName = currentUser?.name || patientProfile?.name || 'Vinuth';
  const firstName = rawName.split(' ')[0] || 'Vinuth';

  // Sample medical reports fallback if database reports are empty
  const reportItems = (reports && reports.length > 0) ? reports : [
    {
      id: 'rep-cbc-1',
      title: 'Complete Blood Count',
      type: 'Blood Test',
      date: '27 Aug 2026',
      status: 'Reviewed',
      summary: 'All parameters including Hemoglobin (14.2 g/dL) and WBC (6,800 /mcL) are within healthy reference ranges.'
    },
    {
      id: 'rep-ecg-1',
      title: '12-Lead ECG Report',
      type: 'Cardiology Test',
      date: '24 Aug 2026',
      status: 'Reviewed',
      summary: 'Normal sinus rhythm with no ST-segment elevation or ectopic beats recorded.'
    }
  ];

  // Active database-backed upcoming appointments
  const displayApts = upcomingApts || [];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* 1. WELCOME SECTION & AI HEALTH SCORE BANNER */}
      <section className="glass-card p-6 sm:p-8 border-slate-200/90 bg-gradient-to-br from-white via-sky-50/50 to-cyan-50/30 relative overflow-hidden shadow-sm">
        {/* Soft background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-200/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Welcome Text */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Karavali Health Network Active
              </span>
              <span className="text-slate-400 text-xs font-semibold">• {patientProfile.city || 'Mangaluru / Manipal'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Good evening, <span className="bg-gradient-to-r from-brand-700 via-cyan-700 to-blue-700 bg-clip-text text-transparent">{firstName} 👋</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
              Here's your health overview for today.
            </p>
          </div>

          {/* AI Health Score Card (92/100) */}
          <div className="flex items-center gap-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm shrink-0 w-full lg:w-auto">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="5" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="#0891b2"
                  strokeWidth="5"
                  strokeDasharray={163}
                  strokeDashoffset={163 - (163 * healthScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-black text-base text-slate-900">{healthScore}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Health Score</span>
              <p className="text-lg font-black text-slate-900">{healthScore} / 100</p>
              <p className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Excellent Range
              </p>
            </div>
          </div>
        </div>

        {/* Small Vitals Summary Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10 text-xs">
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</span>
              <p className="font-black text-slate-900">118/78 <span className="text-[10px] text-slate-500 font-normal">mmHg</span></p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Optimal</span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Sugar</span>
              <p className="font-black text-slate-900">98 <span className="text-[10px] text-slate-500 font-normal">mg/dL</span></p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Normal</span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Heart Rate</span>
              <p className="font-black text-slate-900">72 <span className="text-[10px] text-slate-500 font-normal">bpm</span></p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Normal</span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">BMI Index</span>
              <p className="font-black text-slate-900">22.4</p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Normal</span>
          </div>
        </div>
      </section>


      {/* 2. QUICK ACTIONS (Equal 4-Card Grid) */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Quick Health Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Book Appointment */}
          <div
            onClick={() => setActiveView('doctors')}
            className="glass-card p-5 bg-white hover:border-brand-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group rounded-2xl border-slate-200/90"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Calendar className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-brand-600 transition-colors">Book Appointment</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Find and book a doctor</p>
            </div>
            <button className="w-full bg-slate-50 group-hover:bg-brand-600 group-hover:text-white text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-center gap-1">
              <span>Find Doctor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Upload Medical Report */}
          <div
            onClick={() => setActiveView('medical-reports')}
            className="glass-card p-5 bg-white hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group rounded-2xl border-slate-200/90"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">Upload Medical Report</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Get AI-powered report analysis</p>
            </div>
            <button className="w-full bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-center gap-1">
              <span>Upload PDF</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: AI Symptom Checker */}
          <div
            onClick={() => setActiveView('ai-symptom-checker')}
            className="glass-card p-5 bg-gradient-to-b from-cyan-50/40 to-white hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group rounded-2xl border-cyan-200/80"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:text-cyan-700 transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-cyan-700 transition-colors">AI Symptom Checker</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Check your symptoms</p>
            </div>
            <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs">
              <span>Check Symptoms</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Emergency 108 */}
          <div
            onClick={() => setIsEmergencyModalOpen(true)}
            className="glass-card p-5 bg-gradient-to-b from-rose-50/50 to-white hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group rounded-2xl border-rose-200/90"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 group-hover:text-rose-600 transition-colors">Emergency 108</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Get emergency assistance</p>
            </div>
            <button className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-xs">
              <span>Call 108 SOS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>


      {/* 3. UPCOMING APPOINTMENTS (High Priority Horizontal Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Upcoming Consultations ({displayApts.length})</span>
          </h2>
          <button
            onClick={() => setActiveView('appointments')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayApts.length > 0 && (
          <PatientQueueTracker appointment={displayApts[0]} />
        )}

        {displayApts.length > 0 ? (
          <div className="space-y-4">
            {displayApts.map(apt => (
              <div
                key={apt.id}
                className="glass-card p-6 border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-xs rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Doctor Details */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <img
                    src={apt.doctorPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}
                    alt={apt.doctorName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-xs"
                  />
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 shrink-0">
                        {apt.specialization}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        apt.type === 'online' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-brand-50 text-brand-700 border-brand-200'
                      }`}>
                        {apt.type === 'online' ? 'Online Telehealth' : 'In-Person OPD'}
                      </span>
                    </div>

                    {/* Doctor Full Name — NO TRUNCATION */}
                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                      {apt.doctorName}
                    </h3>

                    {/* Hospital Full Name — NO TRUNCATION */}
                    <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{apt.hospitalName}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 font-semibold">
                      <span className="flex items-center gap-1 text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        {apt.date} · {apt.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue Status & Action Button */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right space-y-0.5">
                    <div className="flex items-center gap-1 md:justify-end text-xs font-black text-brand-700">
                      <span>Token #{apt.queueNumber || '01'}</span>
                      <span className="text-slate-400 font-normal">• Waiting time {apt.estimatedWaitTime || '5 min'}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> OPD Queue Waiting Room
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveView('appointments')}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
                  >
                    View Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center text-slate-500 shadow-2xs space-y-2">
            <p className="text-xs font-semibold">No active upcoming consultations scheduled.</p>
            <button
              onClick={() => setActiveView('doctors')}
              className="text-xs font-extrabold text-brand-600 hover:text-brand-700 underline cursor-pointer"
            >
              Book an appointment with top Karavali doctors →
            </button>
          </div>
        )}
      </section>


      {/* 4. HEALTH METRICS (4 Metric Cards with Sparklines) */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Health Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: BMI */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-3 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 font-bold">
              <span className="text-xs">BMI</span>
              <Activity className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-slate-900">22.4</p>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Normal</span>
            </div>
            {/* Sparkline Graphic */}
            <div className="h-6 w-full pt-1">
              <svg className="w-full h-full text-cyan-500" viewBox="0 0 100 20" fill="none">
                <path d="M0 15 Q25 5 50 12 T100 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Blood Pressure */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-3 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 font-bold">
              <span className="text-xs">Blood Pressure</span>
              <HeartPulse className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-slate-900">118/78 <span className="text-xs font-normal text-slate-500">mmHg</span></p>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Optimal</span>
            </div>
            {/* Sparkline Graphic */}
            <div className="h-6 w-full pt-1">
              <svg className="w-full h-full text-rose-400" viewBox="0 0 100 20" fill="none">
                <path d="M0 10 Q25 18 50 8 T100 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Blood Sugar */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-3 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 font-bold">
              <span className="text-xs">Blood Sugar</span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-slate-900">98 <span className="text-xs font-normal text-slate-500">mg/dL</span></p>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Normal</span>
            </div>
            {/* Sparkline Graphic */}
            <div className="h-6 w-full pt-1">
              <svg className="w-full h-full text-amber-400" viewBox="0 0 100 20" fill="none">
                <path d="M0 12 Q30 4 60 14 T100 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Heart Rate */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-3 shadow-xs rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 font-bold">
              <span className="text-xs">Heart Rate</span>
              <HeartPulse className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-slate-900">72 <span className="text-xs font-normal text-slate-500">bpm</span></p>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Normal</span>
            </div>
            {/* Sparkline Graphic */}
            <div className="h-6 w-full pt-1">
              <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 20" fill="none">
                <path d="M0 8 Q20 16 40 6 T80 14 T100 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

        </div>
      </section>


      {/* 5. RECENT MEDICAL REPORTS & AI INSIGHTS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Medical Reports Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Recent Medical Reports</span>
            </h2>
            <button
              onClick={() => setActiveView('medical-reports')}
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {reportItems.map(rep => (
              <div
                key={rep.id}
                className="glass-card p-5 border-slate-200/90 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900">{rep.title}</h3>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        AI Analysis: {rep.status || 'Reviewed'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {rep.type} · {rep.date}
                    </p>
                    <p className="text-xs text-slate-600 font-medium pt-1 line-clamp-1">
                      {rep.summary}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('medical-reports')}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl border border-slate-200/80 transition-colors whitespace-nowrap self-end sm:self-auto"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: AI Health Insight Box */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
            AI Health Recommendation
          </h2>

          <div className="glass-card p-6 border-cyan-200/90 bg-gradient-to-br from-cyan-50/60 via-white to-sky-50/40 space-y-4 shadow-xs rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-800">
              <Sparkles className="w-4.5 h-4.5 text-cyan-600 animate-pulse" />
              <span>Coastal Healthcare Insight</span>
            </div>

            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Based on your coastal region profile, staying hydrated with tender coconut water and maintaining 7 hours of restorative sleep will help reduce resting heart rate by ~4 bpm.
            </p>

            <button
              onClick={() => setActiveView('ai-chatbot')}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Ask AI Health Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>


      {/* 6. NEARBY HOSPITALS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <span>Nearby Hospitals & Medical Centers</span>
          </h2>
          <button
            onClick={() => setActiveView('hospitals')}
            className="text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1"
          >
            <span>View All Hubs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Hospital 1 */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-4 shadow-xs rounded-2xl flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Super Specialty · Emergency Available
              </span>
              <h3 className="font-black text-base text-slate-900 pt-1">Unity Super Specialty Hospital</h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Falnir, Mangaluru · <strong className="text-brand-600">2.5 km</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveView('hospitals')}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200/80 transition-colors"
              >
                View Hospital
              </button>
              <button
                onClick={() => setActiveView('doctors')}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs transition-colors"
              >
                Book Doctor
              </button>
            </div>
          </div>

          {/* Hospital 2 */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-4 shadow-xs rounded-2xl flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Multi Specialty · ICU Ready
              </span>
              <h3 className="font-black text-base text-slate-900 pt-1">KMC Hospital Attavar & Jyothi</h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Attavar, Mangaluru · <strong className="text-brand-600">3.8 km</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveView('hospitals')}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200/80 transition-colors"
              >
                View Hospital
              </button>
              <button
                onClick={() => setActiveView('doctors')}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs transition-colors"
              >
                Book Doctor
              </button>
            </div>
          </div>

          {/* Hospital 3 */}
          <div className="glass-card p-5 border-slate-200/90 bg-white space-y-4 shadow-xs rounded-2xl flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Medical College Hub · 24/7 Trauma
              </span>
              <h3 className="font-black text-base text-slate-900 pt-1">Kasturba Hospital, Manipal</h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Manipal, Udupi · <strong className="text-brand-600">4.2 km</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveView('hospitals')}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200/80 transition-colors"
              >
                View Hospital
              </button>
              <button
                onClick={() => setActiveView('doctors')}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs transition-colors"
              >
                Book Doctor
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
