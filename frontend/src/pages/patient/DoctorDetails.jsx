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
  const [imgError, setImgError] = useState(false);

  const doc = selectedDoctor || doctors[0];

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-bold text-sm">No doctor selected.</p>
        <button onClick={() => setActiveView('doctors')} className="mt-4 text-brand-600 font-bold underline text-xs">Back to Doctors Directory</button>
      </div>
    );
  }

  // Extract clean initials for image fallback
  const initials = doc.name
    ? doc.name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'DR';

  const similarDoctors = doctors.filter(d => d.id !== doc.id && d.specialization === doc.specialization);

  const expYears = typeof doc.experience === 'number' ? doc.experience : parseInt(doc.experience || '10', 10);
  const experienceText = `${expYears || 10} Years Experience`;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* Top Navigation Back Button & Verified Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={() => setActiveView('doctors')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-brand-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-4 py-2 rounded-xl transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-brand-600" />
          <span>Back to Doctors Directory</span>
        </button>

        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Verified Specialist Profile • ABDM ABHA Integrated</span>
        </span>
      </div>

      {/* 1. MAIN DOCTOR PROFILE HEADER CARD */}
      <div className="glass-card p-6 sm:p-8 bg-white border border-slate-200/90 rounded-[22px] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Doctor Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 min-w-0">
            
            {/* 128x128 Profile Photo with Fallback */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs bg-slate-100 flex items-center justify-center">
              {!imgError && doc.photo ? (
                <img
                  src={doc.photo}
                  alt={doc.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-100 via-sky-50 to-cyan-100 flex flex-col items-center justify-center text-brand-700">
                  <Stethoscope className="w-8 h-8 text-brand-600 mb-1" />
                  <span className="text-sm font-black tracking-wider text-slate-800">{initials}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200/80">
                  {doc.specialization}
                </span>
                <span className="text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available Today
                </span>
              </div>

              {/* DOCTOR NAME — MOST PROMINENT TEXT */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {doc.name}
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {doc.education || 'MBBS, MD, DM (Specialist)'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Award className="w-4 h-4 text-brand-600" /> {experienceText}
                </span>
                <span className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-amber-800 font-extrabold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {doc.rating || '4.90'} ({doc.reviewsCount || 130} Verified Reviews)
                </span>
                <span className="flex items-center gap-1.5 text-slate-800 font-extrabold">
                  <Building2 className="w-4 h-4 text-cyan-600" /> {doc.hospitalName}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Fee & Action Box */}
          <div className="w-full lg:w-72 bg-slate-50/90 border border-slate-200/90 p-5 rounded-2xl text-center space-y-3 shrink-0 shadow-2xs">
            <div>
              <span className="text-xs font-semibold text-slate-500">Consultation Fee</span>
              <p className="text-3xl font-black text-slate-900">₹{doc.consultationFee || 750}</p>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block mt-1">
                Includes OPD Token & Prescription
              </span>
            </div>

            <button
              onClick={() => setBookingDoctor(doc)}
              className="w-full bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-sm shadow-brand-500/15 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Calendar className="w-4 h-4" />
              <span>Book OPD Appointment</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Biography, Languages & Patient Reviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Biography & Clinical Background */}
          <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-cyan-600" /> Professional Overview & Clinical Background
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {doc.bio || `${doc.name} is a senior ${doc.specialization} practicing at ${doc.hospitalName} with ${experienceText}. Specialized in advanced clinical diagnostics, OPD consultations, and patient-centered treatment plans.`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">Languages Spoken</span>
                <p className="text-slate-900 font-extrabold">🗣 {doc.languages ? doc.languages.join(', ') : 'English, Kannada, Tulu, Konkani'}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">Hospital Location</span>
                <p className="text-slate-900 font-extrabold truncate">📍 {doc.location || 'Mangaluru'} ({doc.distance || '2.5 km'})</p>
              </div>
            </div>
          </div>

          {/* Patient Feedback & Testimonials */}
          <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-amber-500" /> Patient Feedback ({doc.reviewsCount || 130})
              </h3>
              <span className="text-xs text-amber-800 font-black bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                ★ {doc.rating || '4.90'} / 5.0
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Ramesh K. (Mangaluru)', rating: 5, date: '2 days ago', text: `Consulted ${doc.name} at ${doc.hospitalName}. Very polite, explained my condition thoroughly in Kannada & Tulu.` },
                { name: 'Deepa Shetty (Udupi)', rating: 5, date: '1 week ago', text: 'Zero waiting time with MedConnect live queue tracker. Prescribed effective medications.' },
                { name: 'Venkatesh Rao (Manipal)', rating: 4, date: '2 weeks ago', text: 'Extremely knowledgeable doctor. Took time to analyze all my blood test reports.' },
              ].map((rev, idx) => (
                <div key={idx} className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{rev.name}</span>
                    <span className="text-amber-800 font-extrabold flex items-center gap-1">★ {rev.rating}.0</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{rev.text}</p>
                  <p className="text-[10px] text-slate-500 font-semibold pt-1">{rev.date} • ABDM Verified Patient</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: OPD Slot Selector & Other Specialists */}
        <div className="space-y-6">
          
          {/* OPD Slot Selection Card */}
          <div className="glass-card p-6 border-slate-200/90 bg-white space-y-4 rounded-2xl shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" /> Select Available Time Slot Today
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
                        ? 'bg-brand-600 text-white shadow-sm border-brand-600'
                        : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setBookingDoctor(doc)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirm & Book Appointment</span>
            </button>
          </div>

          {/* Similar Department Doctors */}
          {similarDoctors.length > 0 && (
            <div className="glass-card p-5 border-slate-200/90 bg-white space-y-3 rounded-2xl shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Other {doc.specialization} Specialists
              </h4>

              <div className="space-y-2">
                {similarDoctors.slice(0, 3).map(simDoc => (
                  <div
                    key={simDoc.id}
                    onClick={() => { setSelectedDoctor(simDoc); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={simDoc.photo} alt={simDoc.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs text-slate-900 group-hover:text-brand-600 transition-colors truncate">{simDoc.name}</h5>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{simDoc.hospitalName}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-transform shrink-0" />
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
