import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, Video, Download, XCircle, CheckCircle2, ChevronRight, UserCheck, ShieldCheck, FileText, AlertCircle, Stethoscope, MapPin, Building2 } from 'lucide-react';
import { TelehealthModal } from '../../components/ui/TelehealthModal';
import { PatientQueueTracker } from '../../components/ui/PatientQueueTracker';

export const AppointmentsPage = () => {
  const { appointments, cancelAppointment, setTelehealthAppointment, telehealthAppointment } = useApp();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [rxPreview, setRxPreview] = useState(null);
  const [brokenImages, setBrokenImages] = useState({});

  const isActiveStatus = (status) => ['upcoming', 'booked', 'waiting', 'in_consultation', 'called'].includes(status?.toLowerCase());
  const isCompletedStatus = (status) => status?.toLowerCase() === 'completed';
  const isCancelledStatus = (status) => ['cancelled', 'no_show'].includes(status?.toLowerCase());

  const filtered = (appointments || []).filter(a => {
    if (activeTab === 'upcoming') return isActiveStatus(a.status);
    if (activeTab === 'completed') return isCompletedStatus(a.status);
    if (activeTab === 'cancelled') return isCancelledStatus(a.status);
    return true;
  });

  const getDoctorInitials = (name) => {
    if (!name) return 'DR';
    return name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleImageError = (id) => {
    setBrokenImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> ABDM & Real-Time OPD Integrated
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Consultations</h1>
          <p className="text-xs text-slate-500 font-medium">Manage your verified doctor appointments and live OPD queue tokens</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200 text-xs font-extrabold shadow-2xs">
          {(['upcoming', 'completed', 'cancelled']).map(tab => {
            const count = (appointments || []).filter(a => {
              if (tab === 'upcoming') return isActiveStatus(a.status);
              if (tab === 'completed') return isCompletedStatus(a.status);
              if (tab === 'cancelled') return isCancelledStatus(a.status);
              return false;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl font-extrabold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-6">
        {filtered.length > 0 ? (
          filtered.map(apt => {
            const st = (apt.status || 'waiting').toLowerCase();
            const docName = apt.doctorName || apt.doctor_name || 'Specialist Doctor';
            const docPhoto = apt.doctorPhoto || apt.doctor_photo;
            const specialization = apt.specialization || 'General Physician';
            const hospitalName = apt.hospitalName || apt.hospital_name || 'KMC Hospital';
            const initials = getDoctorInitials(docName);
            const isImgBroken = brokenImages[apt.id];

            return (
              <div
                key={apt.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Embedded Live Queue Tracker if Active */}
                {isActiveStatus(apt.status) && (
                  <div className="mb-2">
                    <PatientQueueTracker appointment={apt} />
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pt-2">
                  
                  {/* Doctor Info Block */}
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    
                    {/* Doctor Photo / Initials Fallback */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs bg-slate-50 flex items-center justify-center">
                      {!isImgBroken && docPhoto ? (
                        <img
                          src={docPhoto}
                          alt={docName}
                          onError={() => handleImageError(apt.id)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-sky-50 to-brand-100 flex flex-col items-center justify-center text-brand-700">
                          <Stethoscope className="w-5 h-5 text-brand-600 mb-0.5" />
                          <span className="text-xs font-black tracking-wider text-slate-800">{initials}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          {specialization}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                          apt.type === 'online'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {apt.type === 'online' ? '● Online Telehealth' : '● In-Person OPD'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">
                        {docName}
                      </h3>
                      
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hospitalName}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 pt-1">
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-brand-600" /> {apt.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> {apt.timeSlot}
                        </span>
                        {isActiveStatus(apt.status) && (
                          <span className="text-brand-700 font-extrabold bg-brand-50/80 px-2.5 py-1 rounded-lg border border-brand-200 flex items-center gap-1">
                            OPD Token #{apt.queueNumber || 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                    
                    {isActiveStatus(apt.status) && (
                      <>
                        {apt.type === 'online' ? (
                          <button
                            onClick={() => setTelehealthAppointment(apt)}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Video Call</span>
                          </button>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs text-emerald-700 font-extrabold flex items-center gap-1.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Checked-In
                          </div>
                        )}

                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          className="bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {isCompletedStatus(apt.status) && (
                      <button
                        onClick={() => setRxPreview(apt)}
                        className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                      >
                        <Download className="w-4 h-4 text-brand-600" />
                        <span>Download Prescription</span>
                      </button>
                    )}

                  </div>

                </div>

              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">No {activeTab} consultations</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              You do not have any {activeTab} consultations scheduled at this moment.
            </p>
          </div>
        )}
      </div>

      {/* Prescription Preview Modal */}
      {rxPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-sm text-slate-900">Digital Prescription</h3>
              </div>
              <button
                onClick={() => setRxPreview(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900">{rxPreview.doctorName || rxPreview.doctor_name}</h4>
                  <p className="text-[11px] font-semibold text-slate-600">{rxPreview.specialization} • {rxPreview.hospitalName || rxPreview.hospital_name}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-semibold">
                  <p>Date: {rxPreview.date}</p>
                  <p>Token: #{rxPreview.queueNumber || 1}</p>
                </div>
              </div>

              <div>
                <p className="font-extrabold text-slate-800 mb-1">Prescribed Clinical Medication:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700 font-medium">
                  <li>Consultation Advice & Medical Observation Completed</li>
                  <li>Follow-up recommended within 14 days if symptoms persist</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between font-bold">
                <span className="text-emerald-700">✓ Verified Clinical Record</span>
                <span className="text-brand-600">MedConnect ABDM</span>
              </div>
            </div>

            <button
              onClick={() => alert('Downloading official prescription receipt...')}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" /> Download Official Receipt
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
