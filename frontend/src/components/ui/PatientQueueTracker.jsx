import React, { useState, useEffect } from 'react';
import { socket, joinPatientRoom, joinAppointmentRoom } from '../../services/socket';
import { fetchQueueStatusApi } from '../../services/api';
import { Clock, UserCheck, Activity, Bell, CheckCircle2, MapPin, AlertCircle, ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';

export const PatientQueueTracker = ({ appointment, onClose }) => {
  const [aptState, setAptState] = useState(appointment);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Real-time backend queue metrics state
  const [queueMetrics, setQueueMetrics] = useState({
    totalBooked: appointment?.queueNumber || 1,
    currentToken: 1,
    yourToken: appointment?.queueNumber || 1,
    patientsAhead: 0,
    status: (appointment?.status || 'waiting').toLowerCase(),
    estimatedWaitTime: 'Immediate (~2 mins)',
  });

  // 1. Fetch Backend-Driven Live Queue Data
  const loadBackendQueueStatus = async () => {
    if (!appointment) return;
    try {
      const data = await fetchQueueStatusApi(
        appointment.doctorId || appointment.doctor_id,
        appointment.doctorName || appointment.doctor_name,
        appointment.date,
        appointment.timeSlot || appointment.time_slot,
        appointment.id
      );

      if (data && data.success) {
        setQueueMetrics({
          totalBooked: data.totalBooked || data.queueStatus?.totalBooked || 1,
          currentToken: data.currentToken || data.queueStatus?.currentToken || 1,
          yourToken: data.yourToken || data.queueStatus?.yourToken || appointment.queueNumber || 1,
          patientsAhead: data.patientsAhead ?? data.queueStatus?.patientsAhead ?? 0,
          status: (data.status || data.queueStatus?.status || appointment.status || 'waiting').toLowerCase(),
          estimatedWaitTime: data.estimatedWaitTime || data.queueStatus?.estimatedWaitTime || 'Immediate (~2 mins)',
        });

        // Trigger toast alerts on status transitions
        const newStatus = (data.status || '').toLowerCase();
        if (newStatus === 'called') {
          setToastMessage("🎉 You're next! Please proceed to the consultation room.");
        } else if (newStatus === 'in_consultation') {
          setToastMessage("🔔 Your consultation with the doctor is starting now.");
        } else if (newStatus === 'completed') {
          setToastMessage("✅ Your consultation has been completed successfully.");
        }
      }
    } catch (err) {
      console.warn('PatientQueueTracker sync fallback:', err.message);
    }
  };

  // 2. Subscribe to Real-Time WebSockets Events & Poll
  useEffect(() => {
    if (!appointment) return;
    setAptState(appointment);

    loadBackendQueueStatus();

    // Join patient room, appointment room, and shared OPD session queue room
    joinPatientRoom(appointment.userId || appointment.user_id);
    joinAppointmentRoom(appointment.id);

    const docId = appointment.doctorId || appointment.doctor_id;
    const aptDate = appointment.date;
    const timeSlot = appointment.timeSlot || appointment.time_slot;

    if (docId && aptDate && timeSlot) {
      socket.emit('join:session', { doctorId: docId, date: aptDate, timeSlot });
    }

    const handleQueueChange = (payload) => {
      console.log('⚡ [PatientQueueTracker] Socket.IO Live Queue Update Event:', payload);
      loadBackendQueueStatus();
    };

    socket.on('queue:updated', handleQueueChange);
    socket.on('session_queue_updated', handleQueueChange);
    socket.on('appointment:status_changed', handleQueueChange);
    socket.on('global:queue_changed', handleQueueChange);

    const timer = setInterval(loadBackendQueueStatus, 3000);

    return () => {
      socket.off('queue:updated', handleQueueChange);
      socket.off('session_queue_updated', handleQueueChange);
      socket.off('appointment:status_changed', handleQueueChange);
      socket.off('global:queue_changed', handleQueueChange);
      clearInterval(timer);
    };
  }, [appointment?.id, appointment?.doctorId, appointment?.date, appointment?.timeSlot]);

  if (!aptState) return null;

  const status = queueMetrics.status || (aptState.status || 'waiting').toLowerCase();
  const yourToken = queueMetrics.yourToken;
  const currentToken = queueMetrics.currentToken;
  const patientsAhead = queueMetrics.patientsAhead;
  const estimatedWait = queueMetrics.estimatedWaitTime;

  return (
    <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-[22px] shadow-md space-y-6 relative overflow-hidden">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="bg-brand-600 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between text-xs font-extrabold animate-bounce">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Doctor & Hospital Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {aptState.specialization || 'Specialist Doctor'}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">{aptState.doctorName || aptState.doctor_name}</h3>
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {aptState.hospitalName || aptState.hospital_name || 'KMC Hospital'}
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Live Realtime Queue
        </span>
      </div>

      {/* Dynamic Status Alert Banner */}
      <div>
        {status === 'called' && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-sm text-xs space-y-1">
            <p className="font-black text-sm flex items-center gap-2">
              🎉 You're Next!
            </p>
            <p className="font-semibold text-emerald-50">Please proceed to Consultation Room #102 immediately.</p>
          </div>
        )}

        {status === 'in_consultation' && (
          <div className="bg-gradient-to-r from-brand-600 to-cyan-600 text-white p-4 rounded-2xl shadow-sm text-xs space-y-1">
            <p className="font-black text-sm flex items-center gap-2">
              🔔 Consultation In Progress
            </p>
            <p className="font-semibold text-cyan-50">You are currently inside the doctor's consultation room.</p>
          </div>
        )}

        {status === 'completed' && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 rounded-2xl text-xs space-y-1">
            <p className="font-black text-sm flex items-center gap-2 text-emerald-800">
              ✅ Consultation Completed
            </p>
            <p className="font-semibold text-emerald-700">Thank you for visiting. Prescription available in your dashboard.</p>
          </div>
        )}

        {['waiting', 'booked', 'upcoming'].includes(status) && (
          <div className={`p-4 rounded-2xl text-xs space-y-1 border ${
            patientsAhead === 0
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <p className="font-black text-sm flex items-center gap-2">
              {patientsAhead === 0 ? "🟢 Your turn is approaching" : "🟡 Waiting in OPD Queue"}
            </p>
            <p className="font-semibold">
              {patientsAhead === 0
                ? "You are next in line! Please wait near Consultation Room #102."
                : `There are ${patientsAhead} patient(s) ahead of you in the queue.`}
            </p>
          </div>
        )}
      </div>

      {/* 4 Key Queue Indicator Metrics (Shared Queue, Personalized Token) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your Token</span>
          <p className="text-2xl font-black text-brand-700">#{yourToken < 10 ? `0${yourToken}` : yourToken}</p>
          <span className="text-[10px] font-bold text-slate-500">Personal OPD Token</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Token</span>
          <p className="text-2xl font-black text-slate-900">#{currentToken < 10 ? `0${currentToken}` : currentToken}</p>
          <span className="text-[10px] font-bold text-slate-500">Active Room Token</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Patients Ahead</span>
          <p className="text-2xl font-black text-slate-900">{patientsAhead}</p>
          <span className="text-[10px] font-bold text-slate-500">In Waiting Line</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Wait</span>
          <p className="text-sm font-black text-slate-900 pt-2">{estimatedWait}</p>
          <span className="text-[10px] font-bold text-slate-500">Live AI Estimate</span>
        </div>
      </div>

    </div>
  );
};
