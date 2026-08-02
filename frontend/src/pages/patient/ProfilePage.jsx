import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Shield, Moon, Globe, Phone, Mail, MapPin, FileText, CheckCircle2, Save } from 'lucide-react';

export const ProfilePage = () => {
  const { patientProfile } = useApp();
  const [profile, setProfile] = useState(patientProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Patient Profile & Settings</h1>
          <p className="text-xs text-slate-400">Manage medical records, emergency contacts & insurance details</p>
        </div>

        {saved && (
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Profile Updated
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal Details */}
        <div className="glass-card p-6 border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <User className="w-4 h-4" /> Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="glass-input text-xs w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                className="glass-input text-xs w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Mobile Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                className="glass-input text-xs w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">Blood Group</label>
              <input
                type="text"
                value={profile.bloodGroup}
                onChange={e => setProfile({ ...profile, bloodGroup: e.target.value })}
                className="glass-input text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* Emergency & Insurance */}
        <div className="glass-card p-6 border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Emergency Contact & Insurance
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1 block">108 Emergency Contact Person</label>
              <input
                type="text"
                value={profile.emergencyContact}
                onChange={e => setProfile({ ...profile, emergencyContact: e.target.value })}
                className="glass-input text-xs w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Insurance Provider</label>
                <input
                  type="text"
                  value={profile.insuranceProvider}
                  onChange={e => setProfile({ ...profile, insuranceProvider: e.target.value })}
                  className="glass-input text-xs w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 block">Policy Number</label>
                <input
                  type="text"
                  value={profile.policyNumber}
                  onChange={e => setProfile({ ...profile, policyNumber: e.target.value })}
                  className="glass-input text-xs w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="glass-card p-6 border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Regional & App Settings
          </h3>

          <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-3">
            <div>
              <p className="font-bold text-white">Preferred Language</p>
              <p className="text-[11px] text-slate-400">Kannada / Tulu AI Translation Enabled</p>
            </div>
            <span className="font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl">English & Regional</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-bold text-white">Futuristic Dark Theme</p>
              <p className="text-[11px] text-slate-400">Glassmorphism UI active</p>
            </div>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl">Active</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile Changes</span>
        </button>

      </form>

    </div>
  );
};
