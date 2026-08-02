import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Pill, CheckCircle2, Plus, Clock, Calendar, Sparkles, AlertCircle } from 'lucide-react';

export const MedicineReminder = () => {
  const { medicines, toggleMedicine } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const completedCount = medicines.filter(m => m.completed).length;

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Pill className="w-3.5 h-3.5" /> Daily Dosage Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Medicine Reminders</h1>
          <p className="text-xs text-slate-400">Track daily prescriptions & get scheduled dosage alerts</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Progress Widget */}
      <div className="glass-card p-6 border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">Today's Adherence Progress</h3>
          <p className="text-xs text-slate-400">{completedCount} of {medicines.length} doses taken</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-emerald-400">
            {Math.round((completedCount / medicines.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Medicines Cards List */}
      <div className="space-y-4">
        {medicines.map(med => (
          <div
            key={med.id}
            className={`glass-card p-5 border transition-all flex items-center justify-between gap-4 ${
              med.completed ? 'border-slate-800 opacity-70 bg-slate-950/60' : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleMedicine(med.id)}
                className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                  med.completed
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-transparent hover:border-cyan-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold text-sm ${med.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                    {med.name}
                  </h4>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {med.dosage}
                  </span>
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{med.timeLabel} • {med.timing.join(', ')}</span>
                </p>

                <p className="text-[11px] text-slate-500 italic">{med.instructions}</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              med.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {med.completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};
