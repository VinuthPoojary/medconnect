import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { Activity, HeartPulse, Sparkles, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

export const HealthDashboard = () => {
  const { patientProfile } = useApp();
  const [metricTab, setMetricTab] = useState('heart');

  const heartRateData = [
    { day: 'Mon', bpm: 72 },
    { day: 'Tue', bpm: 75 },
    { day: 'Wed', bpm: 70 },
    { day: 'Thu', bpm: 74 },
    { day: 'Fri', bpm: 71 },
    { day: 'Sat', bpm: 73 },
    { day: 'Sun', bpm: 72 },
  ];

  const bpData = [
    { day: 'Mon', sys: 118, dia: 78 },
    { day: 'Tue', sys: 120, dia: 80 },
    { day: 'Wed', sys: 116, dia: 76 },
    { day: 'Thu', sys: 122, dia: 82 },
    { day: 'Fri', sys: 119, dia: 79 },
    { day: 'Sat', sys: 117, dia: 77 },
    { day: 'Sun', sys: 118, dia: 78 },
  ];

  const sugarData = [
    { day: 'Mon', mgdl: 98 },
    { day: 'Tue', mgdl: 104 },
    { day: 'Wed', mgdl: 95 },
    { day: 'Thu', mgdl: 110 },
    { day: 'Fri', mgdl: 102 },
    { day: 'Sat', mgdl: 99 },
    { day: 'Sun', mgdl: 96 },
  ];

  const weightData = [
    { day: 'Week 1', kg: 64.5 },
    { day: 'Week 2', kg: 64.2 },
    { day: 'Week 3', kg: 64.0 },
    { day: 'Week 4', kg: 63.8 },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" /> AI Health Analytics & Biomarkers
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Health Dashboard</h1>
          <p className="text-xs text-slate-400">Track vital trends and receive weekly AI lifestyle recommendations</p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          {(['heart', 'bp', 'sugar', 'weight']).map(tab => (
            <button
              key={tab}
              onClick={() => setMetricTab(tab)}
              className={`px-3.5 py-2 rounded-xl font-bold uppercase transition-all ${
                metricTab === tab
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'heart' ? 'Heart Rate' : tab === 'bp' ? 'Blood Pressure' : tab === 'sugar' ? 'Sugar' : 'Weight Trend'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Weekly {metricTab.toUpperCase()} Trend Analysis</span>
          </h3>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Stable Baseline
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {metricTab === 'heart' ? (
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[60, 90]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="bpm" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorHeart)" />
              </AreaChart>
            ) : metricTab === 'bp' ? (
              <LineChart data={bpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize }} />
                <YAxis stroke="#64748b" domain={[60, 140]} tick={{ fontSize }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="sys" name="Systolic" stroke="#f43f5e" strokeWidth={3} />
                <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            ) : metricTab === 'sugar' ? (
              <AreaChart data={sugarData}>
                <defs>
                  <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[70, 120]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="mgdl" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSugar)" />
              </AreaChart>
            ) : (
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize }} />
                <YAxis stroke="#64748b" domain={[55, 62]} tick={{ fontSize }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="kg" stroke="#a855f7" strokeWidth={3} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Generated Weekly Insights */}
      <div className="glass-card p-6 border-slate-800 bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
          <Sparkles className="w-4 h-4 text-cyan-400" /> AI Weekly Lifestyle Insights
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white">Cardiovascular Response</h4>
            <p>Resting heart rate averaged 72 bpm with 0 hypertensive spikes during humid afternoon periods.</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <h4 className="font-bold text-white">Metabolic & Hydration</h4>
            <p>Fasting sugar levels remained within 91-98 mg/dL. Continue current coastal dietary fiber intake.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
