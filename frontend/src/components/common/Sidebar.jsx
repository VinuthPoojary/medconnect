import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  Sparkles,
  Bot,
  BrainCircuit,
  Clock,
  Activity,
  Pill,
  AlertTriangle,
  Bell,
  User,
  Stethoscope,
  BarChart3,
  Shield,
  LineChart
} from 'lucide-react';

export const Sidebar = () => {
  const { role, activeView, setActiveView, notifications } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  if (role === 'guest' || activeView === 'landing' || activeView === 'login' || activeView === 'register') {
    return null;
  }

  const patientNav = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
    { view: 'doctors', label: 'Doctors', icon: <UserCheck className="w-4 h-4" /> },
    { view: 'hospitals', label: 'Hospitals', icon: <Building2 className="w-4 h-4" /> },
    { view: 'medical-reports', label: 'Medical Reports', icon: <FileText className="w-4 h-4" /> },
    { view: 'ai-symptom-checker', label: 'AI Symptom Checker', icon: <Sparkles className="w-4 h-4 text-cyan-400" />, isAi: true },
    { view: 'ai-chatbot', label: 'AI Assistant', icon: <Bot className="w-4 h-4 text-cyan-400" />, isAi: true },
    { view: 'smart-recommendation', label: 'Smart Recommendation', icon: <BrainCircuit className="w-4 h-4 text-cyan-400" />, isAi: true },
    { view: 'queue-prediction', label: 'AI Queue Tracker', icon: <Clock className="w-4 h-4 text-cyan-400" />, isAi: true },
    { view: 'health-dashboard', label: 'Health Insights', icon: <Activity className="w-4 h-4" /> },
    { view: 'medicine-reminder', label: 'Medicine Reminders', icon: <Pill className="w-4 h-4 text-emerald-400" /> },
    { view: 'emergency', label: 'Emergency 108', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
    { view: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: unreadCount > 0 ? `${unreadCount}` : undefined },
    { view: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
  ];

  const hospitalNav = [
    { view: 'hospital-overview', label: 'Hospital Overview', icon: <Building2 className="w-4 h-4" /> },
    { view: 'manage-doctors', label: 'Manage Doctors', icon: <Stethoscope className="w-4 h-4" /> },
    { view: 'hospital-appointments', label: 'Appointments Queue', icon: <Calendar className="w-4 h-4" /> },
    { view: 'hospital-analytics', label: 'AI Analytics & Demand', icon: <BarChart3 className="w-4 h-4 text-cyan-400" />, isAi: true },
  ];

  const adminNav = [
    { view: 'admin-overview', label: 'Platform Overview', icon: <Shield className="w-4 h-4 text-emerald-400" /> },
    { view: 'pending-approvals', label: 'Hospital Approvals', icon: <Building2 className="w-4 h-4" /> },
    { view: 'admin-analytics', label: 'Global Analytics', icon: <LineChart className="w-4 h-4 text-cyan-400" />, isAi: true },
  ];

  const currentNav = role === 'hospital' ? hospitalNav : role === 'admin' ? adminNav : patientNav;

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-white/10 hidden md:flex flex-col justify-between py-6 px-4 shrink-0 min-h-[calc(100vh-65px)] sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 mb-2">
            Navigation ({role})
          </p>
          <nav className="space-y-1">
            {currentNav.map((item) => {
              const isActive = activeView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.isAi && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        AI
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
        <p className="text-[10px] text-slate-400">Karavali Health Network</p>
        <p className="text-[11px] font-bold text-cyan-400">Dakshina Kannada & Udupi</p>
      </div>
    </aside>
  );
};
