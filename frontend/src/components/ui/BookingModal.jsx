import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchSlotCountsApi, fetchLiveQueueApi } from '../../services/api';
import { socket } from '../../services/socket';
import { X, Calendar, Clock, Video, UserCheck, CheckCircle2, ShieldCheck, Sparkles, AlertTriangle, Users, Star, ArrowRight, Activity, MapPin, Stethoscope, Check, PhoneCall } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BookingModal = ({ doctor, onClose }) => {
  const { bookAppointment, setActiveView } = useApp();
  
  // Dynamically compute upcoming dates starting today
  const dateOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const label = i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : days[d.getDay()]);
      const dayName = `${months[d.getMonth()]} ${d.getDate()}`;

      options.push({ label, dateStr, dayName });
    }
    return options;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.dateStr || '');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('in-person');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // Real-time slot counts map directly from backend database
  const [slotDataMap, setSlotDataMap] = useState({});
  const [liveQueueList, setLiveQueueList] = useState([]);
  const [imgError, setImgError] = useState(false);

  // 1. Fetch Real-Time Slot Counts from Database strictly scoped to (doctor.id + selectedDate)
  const loadRealtimeCounts = async () => {
    if (!doctor?.id || !selectedDate) return;
    try {
      const data = await fetchSlotCountsApi(doctor.id, doctor.name, selectedDate);
      if (data && data.success) {
        setSlotDataMap(data.slotCounts || {});
      }

      const queueRes = await fetchLiveQueueApi(doctor.id, doctor.name, selectedDate, selectedSlot);
      if (queueRes && Array.isArray(queueRes)) {
        setLiveQueueList(queueRes);
      }
    } catch (err) {
      console.warn('Real-time slot count fetch error:', err.message);
    }
  };

  // 2. Fetch on date or doctor change
  useEffect(() => {
    loadRealtimeCounts();
  }, [doctor.id, doctor.name, selectedDate]);

  // 3. WebSockets Real-Time Listeners
  useEffect(() => {
    if (doctor.id && selectedDate && selectedSlot) {
      socket.emit('join:session', { doctorId: doctor.id, date: selectedDate, timeSlot: selectedSlot });
    }

    const handleSocketUpdate = (data) => {
      // Refresh if it affects this doctor and date
      if (!data || !data.doctorId || data.doctorId === doctor.id || !data.date || data.date === selectedDate) {
        loadRealtimeCounts();
      }
    };

    socket.on('session_queue_updated', handleSocketUpdate);
    socket.on('queue:updated', handleSocketUpdate);
    socket.on('global:queue_changed', handleSocketUpdate);

    return () => {
      socket.off('session_queue_updated', handleSocketUpdate);
      socket.off('queue:updated', handleSocketUpdate);
      socket.off('global:queue_changed', handleSocketUpdate);
    };
  }, [doctor.id, selectedDate, selectedSlot]);

  // Handle Date Selection: clear selected slot when date changes
  const handleDateChange = (newDateStr) => {
    if (selectedDate !== newDateStr) {
      setSelectedDate(newDateStr);
      setSelectedSlot(null); // Bug 9: Clear slot when date changes
      setBookingError(null);
    }
  };

  const currentSlotInfo = (selectedSlot && slotDataMap[selectedSlot]) || { patientsBooked: 0, expectedPosition: 1 };
  const patientsAlreadyBooked = currentSlotInfo.patientsBooked;
  const expectedQueuePosition = currentSlotInfo.expectedPosition;

  // Extract clean doctor initials for image fallback
  const initials = doctor.name
    ? doctor.name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  // Handle Confirm Appointment Submit
  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      setBookingError('Please select both a date and an available time slot.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const res = await bookAppointment(doctor.id, selectedDate, selectedSlot, consultationType);
      
      const pos = res?.queueNumber || res?.appointment?.queueNumber || expectedQueuePosition;

      setConfirmedBookingData({
        doctorName: doctor.name,
        specialization: doctor.specialization,
        date: selectedDate,
        timeSlot: selectedSlot,
        queuePosition: pos,
        patientsAhead: Math.max(0, pos - 1),
        hospitalName: doctor.hospitalName || doctor.hospital_name,
        consultationType,
      });

      setIsSuccess(true);
      
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    } catch (err) {
      setBookingError(err.message || 'Failed to confirm appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSlotsList = doctor.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Modal Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div className="space-y-6">
            
            {/* 1. DOCTOR HEADER CARD */}
            <div className="bg-slate-50/80 border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs bg-white flex items-center justify-center">
                  {!imgError && doctor.photo ? (
                    <img
                      src={doctor.photo}
                      alt={doctor.name}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-sky-50 flex flex-col items-center justify-center text-brand-700">
                      <Stethoscope className="w-5 h-5 text-brand-600 mb-0.5" />
                      <span className="text-xs font-black tracking-wider text-slate-800">{initials}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug truncate">
                    {doctor.name}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 truncate">
                    {doctor.specialization} • {doctor.hospitalName || doctor.hospital_name || 'KMC Hospital'}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Available for Booking
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Queue Indicator */}
              <div className="bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-full text-brand-700 font-extrabold text-xs flex items-center gap-1.5 shrink-0">
                <Activity className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                <span>● Live Queue</span>
              </div>
            </div>

            {/* Error Banner if Any */}
            {bookingError && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-bold animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* 2. CONSULTATION MODE (In-Person vs Online) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Select Consultation Mode
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setConsultationType('in-person')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    consultationType === 'in-person'
                      ? 'border-brand-600 bg-brand-50/60 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      consultationType === 'in-person' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">In-Person</p>
                      <p className="text-[11px] text-slate-500 font-medium">OPD Physical Visit</p>
                    </div>
                  </div>
                  {consultationType === 'in-person' && <Check className="w-4 h-4 text-brand-600 font-black" />}
                </div>

                <div
                  onClick={() => setConsultationType('online')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    consultationType === 'online'
                      ? 'border-brand-600 bg-brand-50/60 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      consultationType === 'online' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">Online Video</p>
                      <p className="text-[11px] text-slate-500 font-medium">Telehealth Consult</p>
                    </div>
                  </div>
                  {consultationType === 'online' && <Check className="w-4 h-4 text-brand-600 font-black" />}
                </div>
              </div>
            </div>

            {/* 3. DATE SELECTION — Only ONE date can be selected at a time */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Select Date
              </label>

              <div className="grid grid-cols-4 gap-2">
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.dateStr;
                  return (
                    <button
                      key={opt.dateStr}
                      type="button"
                      onClick={() => handleDateChange(opt.dateStr)}
                      className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white border-transparent shadow-sm ring-2 ring-brand-500/50'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">{opt.label}</span>
                      <span className="text-xs font-extrabold block mt-0.5">{opt.dayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. REAL-TIME TIME SLOTS GRID (Scoped strictly to selectedDate) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Available Times for {selectedDate}
                </label>
                <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                  Live Database
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlotsList.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  const slotInfo = slotDataMap[slot] || { patientsBooked: 0, expectedPosition: 1 };
                  const booked = slotInfo.patientsBooked;
                  const pos = slotInfo.expectedPosition;

                  return (
                    <div
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setBookingError(null);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/80 shadow-2xs ring-2 ring-brand-500'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>
                          {slot}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 font-black" />}
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-[11px] font-semibold text-slate-600">
                          {booked} {booked === 1 ? 'patient' : 'patients'} booked
                        </p>
                        <p className="text-[11px] font-extrabold text-brand-700">
                          Your position: #{pos}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. SELECTED APPOINTMENT SUMMARY */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-extrabold text-slate-900">Appointment Summary</span>
                {selectedSlot ? (
                  <span className="text-[10px] font-black uppercase text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded">
                    Queue Position #{expectedQueuePosition}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    Please Select Slot
                  </span>
                )}
              </div>

              <div className="space-y-1 font-semibold text-slate-700">
                <p>📅 Date: <strong className="text-slate-900">{selectedDate}</strong></p>
                <p>🕘 Session Time: <strong className={selectedSlot ? 'text-slate-900' : 'text-amber-600'}>
                  {selectedSlot || 'No slot selected'}
                </strong></p>
                {selectedSlot && (
                  <p className="text-slate-600 pt-1">
                    💡 <strong>{patientsAlreadyBooked}</strong> {patientsAlreadyBooked === 1 ? 'patient has' : 'patients have'} already booked this session on {selectedDate}.
                  </p>
                )}
              </div>

              {/* Queue Visualization */}
              {selectedSlot && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Live Queue Sequence
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
                    {Array.from({ length: Math.min(3, patientsAlreadyBooked) }).map((_, i) => (
                      <span key={i} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        ● #{i + 1} Booked
                      </span>
                    ))}
                    <span className="bg-brand-600 text-white px-2 py-0.5 rounded-md font-extrabold shadow-2xs">
                      ★ #{expectedQueuePosition} YOU
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 6. BOOKING BUTTON — Disabled if no slot selected or submitting */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting || !selectedSlot || !selectedDate}
                onClick={handleConfirmBooking}
                className={`w-full text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  isSubmitting || !selectedSlot || !selectedDate
                    ? 'bg-slate-300 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 shadow-brand-500/20 cursor-pointer'
                }`}
              >
                <span>{isSubmitting ? 'Reserving OPD Token in Database...' : 'Confirm Appointment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-slate-500 font-semibold">
                ₹{doctor.consultationFee || 750} consultation fee • Single Token System • Live queue tracking
              </p>
            </div>

          </div>
        ) : (
          /* SUCCESS SCREEN */
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                OPD Token Confirmed & Reserved in Database
              </span>
              <h2 className="text-2xl font-black text-slate-900">Appointment Booked!</h2>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Your appointment with <strong className="text-slate-900">{confirmedBookingData?.doctorName}</strong> is registered in MedConnect Karavali.
              </p>
            </div>

            {/* Confirmation Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 text-left space-y-3 text-xs max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-extrabold text-slate-900">Your OPD Token</span>
                <span className="text-lg font-black text-brand-700">#{confirmedBookingData?.queuePosition}</span>
              </div>

              <div className="space-y-1 font-semibold text-slate-700">
                <p>🗓 Date: <strong className="text-slate-900">{confirmedBookingData?.date}</strong></p>
                <p>🕘 Time Session: <strong className="text-slate-900">{confirmedBookingData?.timeSlot}</strong></p>
                <p>🏥 Location: <strong className="text-slate-900">{confirmedBookingData?.hospitalName}</strong></p>
                <p>👥 Patients Ahead: <strong className="text-brand-700">{confirmedBookingData?.patientsAhead}</strong></p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (setActiveView) setActiveView('dashboard');
              }}
              className="w-full max-w-md bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-sm transition-all cursor-pointer"
            >
              Go to Patient Dashboard & Track Live Queue
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
