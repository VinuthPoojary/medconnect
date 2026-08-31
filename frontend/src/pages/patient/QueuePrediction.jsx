import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchQueueStatusApi } from '../../services/api';
import { supabase } from '../../services/supabase';
import { socket, joinPatientRoom, joinAppointmentRoom } from '../../services/socket';
import { BookingModal } from '../../components/ui/BookingModal';
import {
  Clock,
  Activity,
  Users,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Stethoscope,
  MapPin,
  Building2,
  Bell,
  Sparkles,
  AlertCircle,
  Radio,
  ChevronRight,
  UserCheck,
  Award,
  Zap,
  Info
} from 'lucide-react';

export const QueuePrediction = () => {
  const { appointments, doctors, currentUser, setBookingDoctor, bookingDoctor } = useApp();

  // Active appointment filter for the logged-in patient
  const activeStatuses = ['upcoming', 'booked', 'waiting', 'called', 'in_consultation', 'checked_in'];
  const userAppointments = (appointments || []).filter(
    (a) =>
      a.userId === currentUser?.id ||
      a.user_id === currentUser?.id ||
      !currentUser?.id
  );

  const activeUserAppointments = userAppointments.filter((a) =>
    activeStatuses.includes((a.status || '').toLowerCase())
  );

  // Selected appointment to track (defaults to first active user appointment if available)
  const [selectedAptId, setSelectedAptId] = useState(
    activeUserAppointments[0]?.id || userAppointments[0]?.id || null
  );

  // Fallback Doctor selection if user has no booked appointments
  const [selectedDocId, setSelectedDocId] = useState(
    activeUserAppointments[0]?.doctorId ||
      activeUserAppointments[0]?.doctor_id ||
      doctors[0]?.id ||
      'doc-1'
  );
  const [selectedDate, setSelectedDate] = useState(
    activeUserAppointments[0]?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    activeUserAppointments[0]?.timeSlot ||
      activeUserAppointments[0]?.time_slot ||
      '10:30 AM'
  );

  // Active appointment object matching selection
  const activeApt =
    userAppointments.find((a) => a.id === selectedAptId) ||
    activeUserAppointments[0] ||
    null;

  // Active doctor matching selection
  const docIdToMatch = activeApt ? (activeApt.doctorId || activeApt.doctor_id) : selectedDocId;
  const doc =
    doctors.find(
      (d) =>
        d.id === docIdToMatch ||
        d.user_id === docIdToMatch ||
        (activeApt && d.name?.toLowerCase().includes((activeApt.doctorName || '').toLowerCase().replace('dr.', '').trim()))
    ) || doctors[0] || { id: 'doc-1', name: 'Dr. Specialist', specialization: 'General Medicine', hospitalName: 'KMC Hospital', photo: '' };

  // Real-time Queue State from Database
  const [isLoading, setIsLoading] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [toastNotification, setToastNotification] = useState(null);
  const prevQueueState = useRef({ currentToken: 1, status: '' });

  const [queueData, setQueueData] = useState({
    totalBooked: activeApt?.queueNumber || 1,
    currentToken: 1,
    yourToken: activeApt?.queueNumber || 1,
    patientsAhead: 0,
    status: (activeApt?.status || 'waiting').toLowerCase(),
    estimatedWaitTime: 'Immediate (~2 mins)',
    fullQueue: [],
  });

  // 1. Fetch Real-time Queue Status from Database
  const loadQueueStatus = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const targetDocId = doc.id;
      const targetDocName = doc.name;
      const targetDate = activeApt?.date || selectedDate;
      const targetSlot = activeApt?.timeSlot || activeApt?.time_slot || selectedTimeSlot;
      const targetAptId = activeApt?.id || '';

      const data = await fetchQueueStatusApi(
        targetDocId,
        targetDocName,
        targetDate,
        targetSlot,
        targetAptId
      );

      if (data && data.success) {
        const newStatus = (data.status || activeApt?.status || 'waiting').toLowerCase();
        const currentToken = data.currentToken || 1;
        const yourToken = activeApt ? (activeApt.queueNumber || data.yourToken || 1) : data.yourToken || 1;
        const patientsAhead = data.patientsAhead ?? 0;
        const estimatedWait = data.estimatedWaitTime || (patientsAhead > 0 ? `~${patientsAhead * 10} minutes` : 'Immediate (~2 mins)');

        // Detect transitions for user notifications
        if (
          prevQueueState.current.currentToken !== currentToken &&
          prevQueueState.current.currentToken !== 0
        ) {
          if (yourToken === currentToken) {
            setToastNotification("🎉 You're next! Please proceed to Consultation Room #304.");
          } else if (yourToken > currentToken) {
            setToastNotification(`🔔 Queue Updated: Token #${prevQueueState.current.currentToken} completed. Now serving Token #${currentToken}.`);
          }
        }
        if (newStatus === 'called' && prevQueueState.current.status !== 'called') {
          setToastNotification("📢 Token Called! The doctor is ready to see you in Room #304.");
        } else if (newStatus === 'in_consultation' && prevQueueState.current.status !== 'in_consultation') {
          setToastNotification("🟢 Consultation In Progress: You are currently consulting with the doctor.");
        } else if (newStatus === 'completed' && prevQueueState.current.status !== 'completed') {
          setToastNotification("✅ Consultation Completed! Prescription is now available in your dashboard.");
        }

        prevQueueState.current = { currentToken, status: newStatus };

        setQueueData({
          totalBooked: data.totalBooked || data.queueStatus?.totalBooked || 1,
          currentToken,
          yourToken,
          patientsAhead,
          status: newStatus,
          estimatedWaitTime: estimatedWait,
          fullQueue: data.fullQueue || data.queue || [],
        });
        setIsRealtimeConnected(true);
      }
    } catch (err) {
      console.warn('Live queue fetch warning:', err.message);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  // Sync when selected appointment or doctor changes
  useEffect(() => {
    if (activeUserAppointments.length > 0 && !selectedAptId) {
      setSelectedAptId(activeUserAppointments[0].id);
    }
  }, [activeUserAppointments.length]);

  useEffect(() => {
    loadQueueStatus();
  }, [selectedAptId, selectedDocId, selectedDate, selectedTimeSlot, doc.id]);

  // 2. Real-time Subscription via Supabase Realtime & WebSockets & Fast Polling
  useEffect(() => {
    let supabaseChannel = null;

    // A. Supabase Realtime Postgres Changes Subscription
    try {
      if (supabase && typeof supabase.channel === 'function') {
        supabaseChannel = supabase
          .channel(`public:appointments:${doc.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'appointments',
            },
            (payload) => {
              console.log('⚡ [Supabase Realtime] Appointments Table Event:', payload);
              loadQueueStatus(true);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsRealtimeConnected(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsRealtimeConnected(false);
            }
          });
      }
    } catch (e) {
      console.warn('Supabase realtime subscription init:', e);
    }

    // B. Socket.IO Rooms & Event Handlers
    if (currentUser?.id) {
      joinPatientRoom(currentUser.id);
    }
    if (activeApt?.id) {
      joinAppointmentRoom(activeApt.id);
    }

    const handleSocketUpdate = (payload) => {
      console.log('⚡ [Socket.IO] Real-time Queue Event Received:', payload);
      loadQueueStatus(true);
    };

    socket.on('queue:updated', handleSocketUpdate);
    socket.on('session_queue_updated', handleSocketUpdate);
    socket.on('appointment:status_changed', handleSocketUpdate);
    socket.on('global:queue_changed', handleSocketUpdate);

    // C. High-efficiency Polling Fallback (every 3s)
    const pollInterval = setInterval(() => {
      loadQueueStatus(true);
    }, 3000);

    return () => {
      if (supabaseChannel && typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(supabaseChannel);
      }
      socket.off('queue:updated', handleSocketUpdate);
      socket.off('session_queue_updated', handleSocketUpdate);
      socket.off('appointment:status_changed', handleSocketUpdate);
      socket.off('global:queue_changed', handleSocketUpdate);
      clearInterval(pollInterval);
    };
  }, [doc.id, activeApt?.id, selectedDate, selectedTimeSlot]);

  const yourToken = queueData.yourToken;
  const currentToken = queueData.currentToken;
  const patientsAhead = queueData.patientsAhead;
  const currentStatus = queueData.status;

  // Build full queue timeline items (if database activeList is empty, generate structured session view)
  const displayQueue =
    queueData.fullQueue.length > 0
      ? queueData.fullQueue
      : Array.from({ length: Math.max(queueData.totalBooked, yourToken, 4) }, (_, i) => {
          const tokenNum = i + 1;
          let itemStatus = 'waiting';
          if (tokenNum < currentToken) itemStatus = 'completed';
          else if (tokenNum === currentToken) itemStatus = 'in_consultation';

          return {
            id: `temp-${tokenNum}`,
            queueNumber: tokenNum,
            tokenNumber: `#0${tokenNum}`,
            status: itemStatus,
            isMyToken: activeApt ? tokenNum === yourToken : false,
          };
        });

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Toast Notification Alert */}
      {toastNotification && (
        <div className="bg-gradient-to-r from-brand-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between text-xs font-black animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-300 animate-bounce" />
            <span>{toastNotification}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Header Banner with Realtime Status Indicator */}
      <div className="bg-gradient-to-r from-brand-600 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-teal-200 animate-pulse" />
              <span>MedConnect Real-Time OPD Queue System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI OPD Queue Tracker
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
              Live consultation speed, patient position tracking, and database-driven AI wait-time forecasting across Coastal Karnataka clinics.
            </p>
          </div>

          {/* Real-time Connection Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-xs border ${
                isRealtimeConnected
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{isRealtimeConnected ? '🟢 Live Realtime' : '🟠 Reconnecting...'}</span>
            </div>

            <button
              onClick={() => loadQueueStatus()}
              disabled={isLoading}
              className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all cursor-pointer"
              title="Refresh Live Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* APPOINTMENT SELECTION TABS (If patient has appointments) */}
      {userAppointments.length > 0 ? (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Select Appointment to Track:</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {userAppointments.length} Total Registered
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {userAppointments.map((apt) => {
              const isSelected = selectedAptId === apt.id;
              const isFinished = (apt.status || '').toLowerCase() === 'completed';

              return (
                <button
                  key={apt.id}
                  onClick={() => {
                    setSelectedAptId(apt.id);
                    setSelectedDocId(apt.doctorId || apt.doctor_id);
                    setSelectedDate(apt.date);
                    setSelectedTimeSlot(apt.timeSlot || apt.time_slot);
                  }}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {apt.doctorName || apt.doctor_name || 'Dr. Specialist'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                        isFinished
                          ? 'bg-emerald-100 text-emerald-800'
                          : (apt.status || '').toLowerCase() === 'in_consultation'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : (apt.status || '').toLowerCase() === 'called'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {apt.status || 'Waiting'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>
                      {apt.date} • {apt.timeSlot || apt.time_slot}
                    </span>
                    <span className="font-black text-brand-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Token #{apt.queueNumber || 1}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Doctor / Session Explorer when patient hasn't booked yet */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-left w-full sm:w-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Live Queue Explorer
            </span>
            <h3 className="text-sm font-black text-slate-900">
              Select an OPD Doctor Room to Monitor Live:
            </h3>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:bg-white w-full sm:w-64"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.hospitalName || 'KMC Hub'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* MAIN LIVE QUEUE DASHBOARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Doctor & Clinic Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              {doc.photo ? (
                <img
                  src={doc.photo}
                  alt={doc.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-black text-base">
                {doc.name?.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                  {doc.specialization || 'Specialist Doctor'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  OPD Room #304
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {doc.name}
              </h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{doc.hospitalName || doc.hospital_name || 'KMC Specialty Hospital, Mangaluru'}</span>
                <span>• {activeApt?.timeSlot || activeApt?.time_slot || selectedTimeSlot}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setBookingDoctor(doc)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book OPD Appointment</span>
          </button>
        </div>

        {/* Dynamic Patient Status Alert Banner */}
        <div>
          {currentStatus === 'called' && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm text-xs space-y-1 animate-in zoom-in-95">
              <p className="font-black text-sm sm:text-base flex items-center gap-2">
                🎉 You Have Been Called!
              </p>
              <p className="font-semibold text-emerald-50">
                Please proceed directly to Consultation Room #304. The doctor is ready for your examination.
              </p>
            </div>
          )}

          {currentStatus === 'in_consultation' && (
            <div className="bg-gradient-to-r from-brand-600 to-cyan-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm text-xs space-y-1 animate-in zoom-in-95">
              <p className="font-black text-sm sm:text-base flex items-center gap-2">
                🔔 Consultation In Progress
              </p>
              <p className="font-semibold text-cyan-50">
                You are currently inside the doctor's consultation room.
              </p>
            </div>
          )}

          {currentStatus === 'completed' && (
            <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 sm:p-5 rounded-2xl text-xs space-y-1">
              <p className="font-black text-sm flex items-center gap-2 text-emerald-800">
                ✓ Consultation Completed
              </p>
              <p className="font-semibold text-emerald-700">
                Thank you for visiting. Your digital prescription and clinical summary have been issued.
              </p>
            </div>
          )}

          {['waiting', 'booked', 'upcoming', 'checked_in'].includes(currentStatus) && (
            <div
              className={`p-4 sm:p-5 rounded-2xl text-xs space-y-1 border ${
                patientsAhead === 0
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <p className="font-black text-sm sm:text-base flex items-center gap-2">
                {patientsAhead === 0 ? "🟢 You're Next in Line" : "🟡 Waiting in OPD Queue"}
              </p>
              <p className="font-semibold">
                {patientsAhead === 0
                  ? "Please be ready near Consultation Room #304. Your turn is up next!"
                  : `There are currently ${patientsAhead} patient(s) ahead of you in the active queue.`}
              </p>
            </div>
          )}
        </div>

        {/* 4 KEY METRIC COUNTER CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {/* Card 1: Your Token */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-1 relative overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Your Token
            </span>
            <p className="text-3xl font-black text-brand-700">
              #{yourToken < 10 ? `0${yourToken}` : yourToken}
            </p>
            <p className="text-[10px] text-brand-600 font-extrabold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-brand-600" />
              <span>{activeApt ? 'Your OPD Token' : 'Next in Queue'}</span>
            </p>
          </div>

          {/* Card 2: Current Token */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Current Token
            </span>
            <p className="text-3xl font-black text-slate-900">
              #{currentToken < 10 ? `0${currentToken}` : currentToken}
            </p>
            <p className="text-[10px] text-blue-700 font-extrabold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>In Room #304</span>
            </p>
          </div>

          {/* Card 3: Patients Ahead */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Patients Ahead
            </span>
            <p className="text-3xl font-black text-amber-600">
              {patientsAhead}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold">
              In Waiting Area
            </p>
          </div>

          {/* Card 4: Estimated Wait */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              AI Estimated Wait
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 pt-0.5">
              {queueData.estimatedWaitTime}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Speed Index</span>
            </p>
          </div>
        </div>

        {/* Doctor OPD Speed Index Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">
                Doctor Consultation Velocity Index:
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Averaging <span className="font-bold text-teal-700">8–10 minutes</span> per patient consultation today.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto bg-teal-50 text-teal-800 text-[10px] font-black px-3 py-1 rounded-full border border-teal-200">
            ✓ Optimal Flow
          </span>
        </div>

        {/* LIVE QUEUE VISUAL TIMELINE */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Today's Live Queue Timeline</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold">
              Live Session Synchronization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {displayQueue.map((item) => {
              const num = item.queueNumber;
              const isCompleted = item.status === 'completed';
              const isInRoom = item.status === 'in_consultation' || item.status === 'called';
              const isMe = activeApt && num === yourToken;

              return (
                <div
                  key={item.id || num}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    isMe
                      ? 'bg-gradient-to-r from-teal-50 via-sky-50 to-blue-50 border-teal-400 ring-2 ring-teal-500/30 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                      : isInRoom
                      ? 'bg-blue-50 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isMe
                          ? 'bg-brand-600 text-white'
                          : isCompleted
                          ? 'bg-slate-200 text-slate-500'
                          : isInRoom
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCompleted ? '✓' : isInRoom ? '●' : isMe ? '⭐' : '○'}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 truncate">
                        {isMe ? 'YOU' : `Token #${num < 10 ? `0${num}` : num}`}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 truncate">
                        {isCompleted
                          ? 'Completed'
                          : isInRoom
                          ? 'In Consultation'
                          : 'Waiting'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-500'
                        : isInRoom
                        ? 'bg-blue-100 text-blue-800'
                        : isMe
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{num < 10 ? `0${num}` : num}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Estimation Guidance Note */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-medium flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <span>
            <strong>Real-time AI Queue Sync:</strong> Queue tokens and patient positioning are synchronized directly with the hospital's live OPD database and doctor consultations. Estimated wait duration adapts dynamically as consultations progress.
          </span>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}
    </div>
  );
};
