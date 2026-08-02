import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Building2, Users, Calendar, DollarSign, CheckCircle2, XCircle, LineChart, Sparkles } from 'lucide-react';

export const AdminDashboard = () => {
  const { hospitals, approveHospital, rejectHospital } = useApp();

  const pendingHospitals = hospitals.filter(h => !h.approved);
  const approvedHospitals = hospitals.filter(h => h.approved);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" /> MedConnect Karavali Super Admin Console
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Platform Overview</h1>
        <p className="text-xs text-slate-400">Global network administration for coastal Karnataka healthcare ecosystem</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="glass-card p-4 border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Hospitals</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">52</p>
          <p className="text-[10px] text-emerald-400 font-bold">Mangaluru & Udupi</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Doctors</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">124</p>
          <p className="text-[10px] text-cyan-400 font-bold">Verified Roster</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Patients</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">24,890</p>
          <p className="text-[10px] text-purple-400 font-bold">Registered Users</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Consultations</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">48,210</p>
          <p className="text-[10px] text-emerald-400 font-bold">Completed OPDs</p>
        </div>

        <div className="glass-card p-4 border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Platform Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹14.2 L</p>
          <p className="text-[10px] text-amber-400 font-bold">Commission Fees</p>
        </div>

      </div>

      {/* Pending Hospital Approvals Section */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
          <span>Pending Hospital Accreditation Approvals ({pendingHospitals.length})</span>
          <span className="text-xs font-normal text-slate-400">Verification Queue</span>
        </h3>

        <div className="space-y-3">
          {pendingHospitals.length > 0 ? (
            pendingHospitals.map(hosp => (
              <div key={hosp.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                  <p className="text-xs text-slate-400">{hosp.location} • NABH Documents Submitted</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveHospital(hosp.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => rejectHospital(hosp.id)}
                    className="bg-slate-900 hover:bg-rose-950 text-rose-400 border border-slate-800 text-xs font-bold px-3 py-2 rounded-xl"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> All hospital registration requests are verified and approved!
            </div>
          )}
        </div>
      </div>

      {/* Approved Hospital Directory */}
      <div className="glass-card p-6 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Partner Hospitals Network</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approvedHospitals.map(hosp => (
            <div key={hosp.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                <p className="text-xs text-slate-400">{hosp.location.split(',')[0]} • {hosp.doctorsCount} Doctors</p>
              </div>

              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Active Partner
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
