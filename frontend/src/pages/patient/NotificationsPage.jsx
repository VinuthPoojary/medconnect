import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, Sparkles, Calendar, Pill } from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, markNotificationRead } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter(n => filter === 'all' || n.category === filter);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Notifications & Health Alerts</h1>
          <p className="text-xs text-slate-400">Manage real-time appointment reminders & AI triage updates</p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          {(['all', 'appointment', 'medicine', 'ai-alert']).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all ${
                filter === cat ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'ai-alert' ? 'AI Alerts' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(n => (
          <div
            key={n.id}
            className={`glass-card p-5 border flex items-start justify-between gap-4 transition-all ${
              n.read ? 'border-slate-800 opacity-70' : 'border-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                n.category === 'appointment'
                  ? 'bg-brand-500/20 text-cyan-400'
                  : n.category === 'ai-alert'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {n.category === 'appointment' && <Calendar className="w-4 h-4" />}
                {n.category === 'ai-alert' && <Sparkles className="w-4 h-4" />}
                {n.category === 'medicine' && <Pill className="w-4 h-4" />}
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">{n.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-1">{n.timestamp}</p>
              </div>
            </div>

            {!n.read && (
              <button
                onClick={() => markNotificationRead(n.id)}
                className="text-[10px] font-bold text-cyan-400 hover:underline shrink-0"
              >
                Mark Read
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
