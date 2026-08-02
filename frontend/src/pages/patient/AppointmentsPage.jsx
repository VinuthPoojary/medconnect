import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Video, Download, XCircle, CheckCircle2, ChevronRight, UserCheck, ShieldCheck, FileText, AlertCircle } from 'lucide-react';
import { TelehealthModal } from '../../components/ui/TelehealthModal';

export const AppointmentsPage = () => {
  const { appointments, cancelAppointment, setTelehealthAppointment, telehealthAppointment } = useApp();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rxPreview, setRxPreview] = useState(null);

  const filtered = appointments.filter(a => a.status === activeTab);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Consultations</h1>
          <p className="text-xs text-slate-400">Manage OPD queue tickets and telehealth video appointments</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          {(['upcoming', 'completed', 'cancelled']).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab} ({appointments.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map(apt => (
            <div key={apt.id} className="glass-card p-6 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <img
                  src={apt.doctorPhoto}
                  alt={apt.doctorName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/30 shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {apt.specialization}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      apt.type === 'online' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-brand-500/20 text-cyan-300 border border-brand-500/30'
                    }`}>
                      {apt.type === 'online' ? '● Online Telehealth' : 'In-Person OPD'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white">{apt.doctorName}</h3>
                  <p className="text-xs text-slate-400">{apt.hospitalName}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> {apt.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {apt.timeSlot}</span>
                    {apt.status === 'upcoming' && (
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        Queue #{apt.queueNumber} (Est wait: {apt.estimatedWaitTime})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full md:w-auto flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                
                {apt.status === 'upcoming' && (
                  <>
                    {apt.type === 'online' ? (
                      <button
                        onClick={() => setTelehealthAppointment(apt)}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Call</span>
                      </button>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked-In
                      </div>
                    )}

                    <button
                      onClick={() => cancelAppointment(apt.id)}
                      className="bg-slate-950 hover:bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {apt.status === 'completed' && (
                  <button
                    onClick={() => setRxPreview(apt)}
                    className="bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Rx Prescription</span>
                  </button>
                )}

              </div>

            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center text-slate-400 space-y-2 border-slate-800">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold">No {activeTab} appointments found.</p>
          </div>
        )}
      </div>

      {/* Prescription Preview Modal */}
      {rxPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Digital Prescription Preview</h3>
              </div>
              <button onClick={() => setRxPreview(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div>
                  <h4 className="font-extrabold text-sm text-brand-700">{rxPreview.doctorName}</h4>
                  <p className="text-[10px] text-slate-600">{rxPreview.specialization} • {rxPreview.hospitalName}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <p>Date: {rxPreview.date}</p>
                  <p>Rx ID: #KAR-88901</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">Rx Prescribed Medication:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Atorvastatin 10mg - 1 Tab (Night after dinner) x 30 days</li>
                  <li>Omega-3 Fatty Acid 1000mg - 1 Softgel (Afternoon) x 30 days</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
                <span>Digitally Signed via MedConnect AI</span>
                <span className="font-bold text-brand-600">Verified QR Code</span>
              </div>
            </div>

            <button
              onClick={() => alert('Downloading official PDF Prescription...')}
              className="w-full bg-cyan-600 text-white font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Signed PDF
            </button>
          </div>
        </div>
      )}

      {/* Telehealth Video Call Modal */}
      {telehealthAppointment && (
        <TelehealthModal appointment={telehealthAppointment} onClose={() => setTelehealthAppointment(null)} />
      )}

    </div>
  );
};
