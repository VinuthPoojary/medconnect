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

  // Structured Patient Navigation Sections as requested
  const patientSections = [
    {
      title: 'Overview',
      items: [
        { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { view: 'appointments', label: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
        { view: 'doctors', label: 'Doctors', icon: <UserCheck className="w-4 h-4" /> },
        { view: 'hospitals', label: 'Hospitals', icon: <Building2 className="w-4 h-4" /> },
      ]
    },
    {
      title: 'Health',
      items: [
        { view: 'medical-reports', label: 'Medical Reports', icon: <FileText className="w-4 h-4" /> },
        { view: 'health-dashboard', label: 'Health Insights', icon: <Activity className="w-4 h-4" /> },
        { view: 'medicine-reminder', label: 'Medicine Reminders', icon: <Pill className="w-4 h-4 text-emerald-600" /> },
      ]
    },
    {
      title: 'AI Services',
      items: [
        { view: 'ai-symptom-checker', label: 'AI Symptom Checker', icon: <Sparkles className="w-4 h-4 text-cyan-600" />, isAi: true },
        { view: 'ai-chatbot', label: 'AI Assistant', icon: <Bot className="w-4 h-4 text-cyan-600" />, isAi: true },
        { view: 'smart-recommendation', label: 'Smart Recommendations', icon: <BrainCircuit className="w-4 h-4 text-cyan-600" />, isAi: true },
        { view: 'queue-prediction', label: 'AI Queue Tracker', icon: <Clock className="w-4 h-4 text-cyan-600" />, isAi: true },
      ]
    },
    {
      title: 'Emergency',
      items: [
        { view: 'emergency', label: 'Emergency 108', icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> },
      ]
    }
  ];

  const doctorSections = [
    {
      title: 'Doctor Workspace',
      items: [
        { view: 'doctor-dashboard', label: 'OPD Clinic Queue', icon: <Activity className="w-4 h-4 text-cyan-600" /> },
        { view: 'doctor-appointments', label: 'My Appointments', icon: <Calendar className="w-4 h-4 text-brand-600" /> },
        { view: 'doctor-prescriptions', label: 'Issue Prescriptions', icon: <Pill className="w-4 h-4 text-emerald-600" /> },
        { view: 'doctor-profile', label: 'Doctor Profile', icon: <User className="w-4 h-4 text-slate-600" /> },
      ]
    }
  ];

  const hospitalSections = [
    {
      title: 'Hospital Admin',
      items: [
        { view: 'hospital-overview', label: 'Hospital Overview', icon: <Building2 className="w-4 h-4" /> },
        { view: 'manage-doctors', label: 'Manage Doctors', icon: <Stethoscope className="w-4 h-4" /> },
        { view: 'hospital-appointments', label: 'Appointments Queue', icon: <Calendar className="w-4 h-4" /> },
        { view: 'hospital-analytics', label: 'AI Analytics & Demand', icon: <BarChart3 className="w-4 h-4 text-cyan-600" />, isAi: true },
      ]
    }
  ];

  const adminSections = [
    {
      title: 'System Admin',
      items: [
        { view: 'admin-overview', label: 'Platform Overview', icon: <Shield className="w-4 h-4 text-emerald-600" /> },
        { view: 'pending-approvals', label: 'Hospital Approvals', icon: <Building2 className="w-4 h-4" /> },
        { view: 'admin-analytics', label: 'Global Analytics', icon: <LineChart className="w-4 h-4 text-cyan-600" />, isAi: true },
      ]
    }
  ];

  const sections = role === 'doctor' ? doctorSections : role === 'hospital' ? hospitalSections : role === 'admin' ? adminSections : patientSections;

  return (
    <aside className="w-60 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 hidden md:flex flex-col justify-between py-5 px-3.5 shrink-0 min-h-[calc(100vh-65px)] sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto shadow-xs">
      <div className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
              {section.title}
            </p>

            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-md shadow-brand-500/15'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {item.isAi && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isActive ? 'bg-white/20 text-white' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}>
                          AI
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-0.5 mt-4">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
          <span>Region</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-xs font-black text-slate-800">Coastal Karnataka</p>
        <p className="text-[10px] text-slate-500 font-medium truncate">Dakshina Kannada & Udupi</p>
      </div>
    </aside>
  );
};
