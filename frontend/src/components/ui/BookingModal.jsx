import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Clock, Video, UserCheck, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const BookingModal = ({ doctor, onClose }) => {
  const { bookAppointment, setActiveView } = useApp();
  const [selectedDate, setSelectedDate] = useState('2026-08-03');
  const [selectedSlot, setSelectedSlot] = useState(doctor.availableSlots[0] || '10 AM');
  const [consultationType, setConsultationType] = useState('in-person');
  const [isSuccess, setIsSuccess] = useState(false);

  const dates = [
    { label: 'Mon, Aug 3', value: '2026-08-03' },
    { label: 'Tue, Aug 4', value: '2026-08-04' },
    { label: 'Wed, Aug 5', value: '2026-08-05' },
    { label: 'Thu, Aug 6', value: '2026-08-06' },
  ];

  const handleConfirmBooking = () => {
    bookAppointment(doctor.id, selectedDate, selectedSlot, consultationType);
    setIsSuccess(true);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div className="space-y-6">
            
            {/* Doctor info header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {doctor.specialization}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{doctor.name}</h3>
                <p className="text-xs text-slate-400">{doctor.hospitalName}</p>
              </div>
            </div>

            {/* Consultation Mode */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider">
                1. Select Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConsultationType('in-person')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    consultationType === 'in-person'
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-brand-400" />
                  <div className="text-left">
                    <div>In-Person Visit</div>
                    <div className="text-[10px] text-slate-400 font-normal">Hospital Consultation</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('online')}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    consultationType === 'online'
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span>Online Telehealth</span>
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">HD Video Room</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> 2. Select Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      selectedDate === d.value
                        ? 'bg-gradient-to-r from-brand-600 to-cyan-600 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 block uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> 3. Select Time Slot
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {doctor.availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2 rounded-xl border text-xs font-medium transition-all ${
                      selectedSlot === slot
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee summary & Confirm button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Consultation Fee</p>
                <p className="text-lg font-extrabold text-white">₹{doctor.consultationFee}</p>
              </div>

              <button
                onClick={handleConfirmBooking}
                className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-brand-500/20 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Book</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Appointment Confirmed!</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                Booked with {doctor.name} ({doctor.specialization})
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mt-4 text-xs text-slate-300 space-y-1 text-left max-w-sm mx-auto">
                <p><span className="text-slate-500">Date & Time:</span> <span className="font-semibold text-white">{selectedDate} at {selectedSlot}</span></p>
                <p><span className="text-slate-500">Mode:</span> <span className="font-semibold text-white capitalize">{consultationType} Consultation</span></p>
                <p><span className="text-slate-500">Location/Hub:</span> <span className="font-semibold text-white">{doctor.hospitalName}</span></p>
                <p><span className="text-slate-500">Queue Ticket:</span> <span className="font-bold text-cyan-400">#04 (Est. wait 15 mins)</span></p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => { onClose(); setActiveView('appointments'); }}
                className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/20"
              >
                Go to My Appointments
              </button>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
