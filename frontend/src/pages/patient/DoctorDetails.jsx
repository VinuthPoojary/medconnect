import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  MapPin,
  Languages,
  Award,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  ThumbsUp,
  ShieldCheck,
  Building2,
  Stethoscope,
  ChevronRight,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';

export const DoctorDetails = () => {
  const { selectedDoctor, setSelectedDoctor, doctors, setActiveView, setBookingDoctor, bookingDoctor } = useApp();
  const [selectedSlot, setSelectedSlot] = useState(null);

  const doc = selectedDoctor || doctors[0];

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">No doctor selected.</p>
        <button onClick={() => setActiveView('doctors')} className="mt-4 text-cyan-400 underline">Back to Doctors Directory</button>
      </div>
    );
  }

  const similarDoctors = doctors.filter(d => d.id !== doc.id && d.specialization === doc.specialization);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('doctors')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-all hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to Doctors Directory</span>
        </button>

        <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Specialist Profile • ABDM ABHA Integrated</span>
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="glass-card p-6 sm:p-8 border-slate-800 relative overflow-hidden bg-slate-900/90 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Doctor Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={doc.photo}
              alt={doc.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-cyan-500/30 glow-cyan shrink-0"
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-3 py-0.5 rounded-full border border-cyan-500/30">
                  {doc.specialization}
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available Today
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{doc.name}</h1>
              <p className="text-xs text-slate-300 font-medium">{doc.education}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-cyan-400" /> {doc.experience} Experience</span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold"><Star className="w-4 h-4 fill-amber-400" /> {doc.rating} ({doc.reviewsCount} Verified Reviews)</span>
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-brand-400" /> {doc.hospitalName}</span>
              </div>
            </div>
          </div>

          {/* Quick Fee & Action Box */}
          <div className="w-full md:w-auto bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center space-y-3 shrink-0">
            <div>
              <span className="text-xs text-slate-400 font-medium">Consultation Fee</span>
              <p className="text-3xl font-black text-white">₹{doc.consultationFee}</p>
              <span className="text-[10px] text-emerald-400 font-semibold">Includes OPD Token & Prescription</span>
            </div>

            <button
              onClick={() => setBookingDoctor(doc)}
              className="w-full bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book OPD Appointment</span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid: Biography, Timings & Patient Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: About & Testimonials */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Biography & Qualifications */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-400" /> Professional Overview & Clinical Background
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{doc.bio}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Languages Spoken</span>
                <p className="text-cyan-300 font-semibold">{doc.languages ? doc.languages.join(', ') : 'Kannada, English, Tulu'}</p>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Hospital Location</span>
                <p className="text-slate-200 font-semibold truncate">{doc.location} ({doc.distance})</p>
              </div>
            </div>
          </div>

          {/* Patient Reviews & Testimonials */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-amber-400" /> Patient Feedback & Testimonials ({doc.reviewsCount})
              </h3>
              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                ★ {doc.rating} / 5.0
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Ramesh K. (Mangaluru)', rating: 5, date: '2 days ago', text: `Consulted ${doc.name} at ${doc.hospitalName}. Very polite, explained my condition thoroughly in Kannada & Tulu.` },
                { name: 'Deepa Shetty (Udupi)', rating: 5, date: '1 week ago', text: 'Zero waiting time with MedConnect live queue tracker. Prescribed effective medications.' },
                { name: 'Venkatesh Rao (Manipal)', rating: 4, date: '2 weeks ago', text: 'Extremely knowledgeable doctor. Took time to analyze all my blood test reports.' },
              ].map((rev, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{rev.name}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">★ {rev.rating}.0</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.text}</p>
                  <p className="text-[10px] text-slate-500 pt-1">{rev.date} • ABDM Verified Patient</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: OPD Slots & Similar Doctors */}
        <div className="space-y-6">
          
          {/* OPD Slot Selection Card */}
          <div className="glass-card p-6 border-slate-800 space-y-4 bg-slate-900/90">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> Select Available Time Slot Today
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {(doc.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM', '04:30 PM']).map(slot => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md glow-cyan ring-2 ring-cyan-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setBookingDoctor(doc)}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirm & Book Appointment</span>
            </button>
          </div>

          {/* Similar Department Doctors */}
          {similarDoctors.length > 0 && (
            <div className="glass-card p-5 border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Other {doc.specialization} Specialists
              </h4>

              <div className="space-y-2">
                {similarDoctors.slice(0, 3).map(simDoc => (
                  <div
                    key={simDoc.id}
                    onClick={() => { setSelectedDoctor(simDoc); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={simDoc.photo} alt={simDoc.name} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <h5 className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">{simDoc.name}</h5>
                        <p className="text-[10px] text-slate-400">{simDoc.hospitalName}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Booking Modal Popup */}
      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}

    </div>
  );
};
