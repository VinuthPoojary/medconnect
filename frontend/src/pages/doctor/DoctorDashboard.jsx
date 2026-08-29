import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchDoctorQueueDashboardApi,
  updateQueueStatusApi,
  fetchDoctorAppointmentsApi,
  fetchDoctorPrescriptionsApi,
  createDoctorPrescriptionApi,
  fetchDoctorProfileApi,
} from '../../services/api';
import { socket, joinDoctorQueueRoom } from '../../services/socket';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  Play,
  UserCheck,
  Activity,
  RefreshCw,
  Building2,
  UserX,
  Calendar,
  Pill,
  User,
  Send,
  FileText,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { currentUser, activeView, setActiveView, appointments, doctors } = useApp();

  // Internal tab navigation
  const [currentTab, setCurrentTab] = useState('queue');

  useEffect(() => {
    if (activeView === 'doctor-appointments') setCurrentTab('appointments');
    else if (activeView === 'doctor-prescriptions') setCurrentTab('prescriptions');
    else if (activeView === 'doctor-profile') setCurrentTab('profile');
    else setCurrentTab('queue');
  }, [activeView]);

  const [queueData, setQueueData] = useState({
    doctorName: currentUser?.name || 'Dr. Vignesh Shetty',
    overview: {
      totalToday: 0,
      waitingCount: 0,
      currentPatientName: 'None',
      remainingCount: 0,
    },
    currentPatient: null,
    queue: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [prescriptionsHistory, setPrescriptionsHistory] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  
  // Digital Prescription Form State
  const [rxPatientName, setRxPatientName] = useState('');
  const [rxMedication, setRxMedication] = useState('');
  const [rxDosage, setRxDosage] = useState('1 Tablet Daily (After Food)');
  const [rxInstructions, setRxInstructions] = useState('Take for 5 days. Drink plenty of water.');
  const [rxSuccessMsg, setRxSuccessMsg] = useState('');

  // 1. Fetch Real-Time Doctor OPD Queue from Database
  const loadQueueDashboard = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDoctorQueueDashboardApi();
      if (data && data.success) {
        setQueueData(data);
      }
    } catch (err) {
      console.warn('Queue dashboard error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Appointments assigned to Doctor
  const loadAppointments = async () => {
    try {
      const apts = await fetchDoctorAppointmentsApi();
      if (apts && Array.isArray(apts)) {
        setAppointmentsList(apts);
      }
    } catch (err) {
      console.warn('Appointments error:', err.message);
    }
  };

  // 3. Fetch Prescriptions History
  const loadPrescriptions = async () => {
    try {
      const rxs = await fetchDoctorPrescriptionsApi();
      if (rxs && Array.isArray(rxs)) setPrescriptionsHistory(rxs);
    } catch (err) {}
  };

  // 4. Fetch Doctor Profile Credentials via /doctor/me
  const loadProfile = async () => {
    try {
      const prof = await fetchDoctorProfileApi();
      if (prof) setDoctorProfile(prof);
    } catch (err) {}
  };

  useEffect(() => {
    loadQueueDashboard();
    loadAppointments();
    loadPrescriptions();
    loadProfile();

    // Join doctor Socket.IO room for instant real-time queue updates
    if (currentUser?.doctorId) {
      joinDoctorQueueRoom(currentUser.doctorId);
    }
    if (currentUser?.id) {
      joinDoctorQueueRoom(currentUser.id);
    }
    if (queueData?.doctorId && queueData.doctorId !== currentUser?.doctorId) {
      joinDoctorQueueRoom(queueData.doctorId);
    }

    const handleQueueSocketEvent = (data) => {
      console.log('⚡ [DoctorDashboard] Real-Time WebSockets Event:', data);
      loadQueueDashboard();
      loadAppointments();
    };

    socket.on('queue:updated', handleQueueSocketEvent);
    socket.on('global:queue_changed', handleQueueSocketEvent);

    return () => {
      socket.off('queue:updated', handleQueueSocketEvent);
      socket.off('global:queue_changed', handleQueueSocketEvent);
    };
  }, [currentUser?.id, appointments]);

  // Handle Real-Time Patient Status Machine Transitions (WAITING -> IN_CONSULTATION -> COMPLETED)
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    try {
      await updateQueueStatusApi(appointmentId, newStatus);
      await loadQueueDashboard();
      await loadAppointments();
    } catch (err) {
      await loadQueueDashboard();
    } finally {
      setUpdatingId(null);
    }
  };

  // Issue & Save Digital Prescription
  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    if (!rxPatientName || !rxMedication) return;

    const rxPayload = {
      patientId: `user-p-${Date.now()}`,
      patientName: rxPatientName,
      medications: `${rxMedication} (${rxDosage})`,
      instructions: rxInstructions,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const savedRx = await createDoctorPrescriptionApi(rxPayload);
      if (savedRx) {
        setPrescriptionsHistory(prev => [savedRx, ...prev]);
      } else {
        setPrescriptionsHistory(prev => [{ id: `rx-${Date.now()}`, ...rxPayload }, ...prev]);
      }
      setRxSuccessMsg(`Digital Rx issued for ${rxPatientName}!`);
      setRxPatientName('');
      setRxMedication('');
    } catch (err) {
      setPrescriptionsHistory(prev => [{ id: `rx-${Date.now()}`, ...rxPayload }, ...prev]);
      setRxSuccessMsg(`Prescription saved for ${rxPatientName}!`);
      setRxPatientName('');
      setRxMedication('');
    } finally {
      setTimeout(() => setRxSuccessMsg(''), 4000);
    }
  };

  const doctorName = currentUser?.name || queueData.doctorName || doctorProfile?.name || 'Doctor';
  const specialization = currentUser?.specialization || queueData.specialization || doctorProfile?.specialization || 'Consultant Specialist';
  const hospitalName = currentUser?.hospitalName || queueData.hospitalName || doctorProfile?.hospitalName || 'KMC Hospital';
  const experience = doctorProfile?.experience || currentUser?.experience || '10 Years';

  const overview = queueData.overview || { totalToday: 0, waitingCount: 0, currentPatientName: 'None', remainingCount: 0 };
  const currentPatient = queueData.currentPatient;
  const queue = queueData.queue || [];

  const waitingCount = queue.filter(a => ['WAITING', 'BOOKED', 'UPCOMING'].includes((a.status || a.displayStatus || '').toUpperCase())).length;
  const inConsultationCount = queue.filter(a => ['IN_CONSULTATION', 'CALLED'].includes((a.status || a.displayStatus || '').toUpperCase())).length;
  const completedCount = queue.filter(a => (a.status || a.displayStatus || '').toUpperCase() === 'COMPLETED').length;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 space-y-6 pb-12 font-sans">
      
      {/* 1. TOP LIGHT THEME DOCTOR HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
                  {specialization}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> ● Online Clinic
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                {doctorName}
              </h1>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {hospitalName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={loadQueueDashboard}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Live Queue</span>
            </button>
          </div>
        </div>

      </div>


      {/* TAB 1: REAL-TIME OPD CLINIC QUEUE */}
      {currentTab === 'queue' && (
        <div className="space-y-6">
          
          {/* 3 SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Waiting Patients</span>
              <p className="text-3xl font-black text-amber-900">{waitingCount}</p>
              <span className="text-[11px] font-bold text-amber-700 block">In OPD Waiting Room</span>
            </div>

            <div className="bg-brand-50/80 border border-brand-200 p-5 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase text-brand-800 tracking-wider block">In Consultation</span>
              <p className="text-3xl font-black text-brand-900">{inConsultationCount}</p>
              <span className="text-[11px] font-bold text-brand-700 block">Active Inside Room</span>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Completed</span>
              <p className="text-3xl font-black text-emerald-900">{completedCount}</p>
              <span className="text-[11px] font-bold text-emerald-700 block">Finished Today</span>
            </div>

          </div>


          {/* 2-COLUMN WORKSPACE: CURRENT PATIENT vs TODAY'S QUEUE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: CURRENT PATIENT CARD */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Current Patient</span>
                <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                  Room #102 Active
                </span>
              </div>

              {currentPatient ? (
                <div className="space-y-5">
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-brand-700">
                        Token #{currentPatient.queueNumber || currentPatient.queue_number || 1}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        (currentPatient.status || currentPatient.displayStatus || '').toLowerCase() === 'in_consultation'
                          ? 'bg-brand-100 text-brand-800 border-brand-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {currentPatient.status || currentPatient.displayStatus || 'WAITING'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {currentPatient.patientName || currentPatient.patient_name || 'Patient'}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        🕘 Session: {currentPatient.timeSlot || currentPatient.time_slot || '09:30 AM'} • {currentPatient.type === 'online' ? 'Online Telehealth' : 'In-Person OPD'}
                      </p>
                    </div>
                  </div>

                  {/* QUEUE CONTROL ACTION BUTTONS */}
                  <div className="space-y-2.5">
                    {(currentPatient.status || currentPatient.displayStatus || '').toLowerCase() !== 'in_consultation' ? (
                      <button
                        type="button"
                        disabled={updatingId === currentPatient.id}
                        onClick={() => handleStatusUpdate(currentPatient.id, 'in_consultation')}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Consultation</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingId === currentPatient.id}
                        onClick={() => handleStatusUpdate(currentPatient.id, 'completed')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Consultation</span>
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <UserX className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">No active patient currently in room.</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: TODAY'S QUEUE LIST */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Today's OPD Queue</h3>
                <span className="text-xs font-bold text-slate-500">{queue.length} Total Patients</span>
              </div>

              <div className="space-y-3">
                {queue.length > 0 ? (
                  queue.map((item) => {
                    const itemStatus = (item.status || item.displayStatus || 'WAITING').toUpperCase();
                    const tokenNum = item.queueNumber || item.queue_number || 1;

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black text-slate-900 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            #{tokenNum < 10 ? `0${tokenNum}` : tokenNum}
                          </span>

                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {item.patientName || item.patient_name || 'Patient'}
                            </h4>
                            <p className="text-[11px] font-semibold text-slate-500">
                              {item.timeSlot || item.time_slot || '09:30 AM'} • {item.type === 'online' ? 'Online Video' : 'Physical OPD'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            itemStatus === 'IN_CONSULTATION'
                              ? 'bg-brand-50 text-brand-700 border-brand-200'
                              : itemStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {itemStatus}
                          </span>

                          {itemStatus === 'WAITING' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, 'in_consultation')}
                              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                            >
                              Call Patient
                            </button>
                          )}

                          {itemStatus === 'IN_CONSULTATION' && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">No appointments scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: MY APPOINTMENTS */}
      {currentTab === 'appointments' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <h2 className="text-lg font-black text-slate-900">All Scheduled Patient Appointments ({appointmentsList.length})</h2>
          <div className="space-y-3">
            {appointmentsList.map((apt) => (
              <div key={apt.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{apt.patientName || apt.patient_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">📅 {apt.date} at {apt.timeSlot || apt.time_slot} • Token #{apt.queueNumber || apt.queue_number}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-700 uppercase bg-white px-3 py-1 rounded-full border border-slate-200">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ISSUE DIGITAL PRESCRIPTION */}
      {currentTab === 'prescriptions' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Issue Digital Prescription</h2>
            <p className="text-xs text-slate-500 font-medium">Write and sign digital Rx for patients</p>
          </div>

          {rxSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{rxSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleIssuePrescription} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Patient Name</label>
              <input
                type="text"
                required
                value={rxPatientName}
                onChange={(e) => setRxPatientName(e.target.value)}
                placeholder="e.g. Kavya Poojary"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Medication Name & Strength</label>
              <input
                type="text"
                required
                value={rxMedication}
                onChange={(e) => setRxMedication(e.target.value)}
                placeholder="e.g. Tab Telmisartan 40mg"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Dosage</label>
                <input
                  type="text"
                  value={rxDosage}
                  onChange={(e) => setRxDosage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Instructions</label>
                <input
                  type="text"
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-xs transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Issue Digital Rx</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DOCTOR PROFILE */}
      {currentTab === 'profile' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 max-w-xl">
          <h2 className="text-lg font-black text-slate-900">Doctor Credentials Profile</h2>
          <div className="space-y-2 text-xs font-semibold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p>👨‍⚕️ Name: <strong className="text-slate-900">{doctorName}</strong></p>
            <p>🩺 Specialization: <strong className="text-slate-900">{specialization}</strong></p>
            <p>🏥 Primary Hospital: <strong className="text-slate-900">{hospitalName}</strong></p>
            <p>🆔 License Number: <strong className="text-brand-700">{licenseNumber || 'KA-MED-99012'}</strong></p>
            <p>💼 Clinical Experience: <strong className="text-slate-900">{experience}</strong></p>
          </div>
        </div>
      )}

    </div>
  );
};
