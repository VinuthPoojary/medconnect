import React, { useState } from 'react';
import { Star, MapPin, Languages, Clock, UserCheck, Stethoscope } from 'lucide-react';

export const DoctorCard = ({ doctor, onSelectProfile, onBookSlot }) => {
  const [imgError, setImgError] = useState(false);

  // Extract clean doctor initials for image fallback
  const initials = doctor.name
    ? doctor.name
        .replace(/^Dr\.\s*/i, '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'DR';

  // Format experience string to avoid duplicate "Years Years Exp."
  const expYears = typeof doctor.experience === 'number'
    ? doctor.experience
    : parseInt(doctor.experience || '10', 10);
  const experienceText = `${expYears || 10} years experience`;

  // Format hospital & distance
  const hospitalName = doctor.hospitalName || 'KMC Hospital Attavar & Jyothi';
  const distanceText = doctor.distance || '2.5 km';
  const languagesList = Array.isArray(doctor.languages) ? doctor.languages.join(' · ') : (doctor.languages || 'English · Kannada');
  const slots = doctor.availableSlots || ['09:30 AM', '11:00 AM', '02:30 PM'];

  return (
    <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-[18px] shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-full group">
      
      {/* 1. DOCTOR HEADER: 80x80 Image & Rating Badge */}
      <div>
        <div className="flex items-start justify-between gap-4">
          
          {/* 80x80 Image with Fallback */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-slate-100 flex items-center justify-center">
            {!imgError && doctor.photo ? (
              <img
                src={doctor.photo}
                alt={doctor.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-100 via-sky-50 to-cyan-100 flex flex-col items-center justify-center text-brand-700">
                <Stethoscope className="w-6 h-6 text-brand-600 mb-0.5" />
                <span className="text-xs font-black tracking-wider text-slate-800">{initials}</span>
              </div>
            )}
          </div>

          {/* Rating Badge (Top Right) */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-amber-800 font-extrabold text-xs shrink-0 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{doctor.rating ? Number(doctor.rating).toFixed(1) : '4.9'}</span>
          </div>
        </div>

        {/* IMPORTANT: Dedicated Row for Doctor Name */}
        <h3
          onClick={() => onSelectProfile && onSelectProfile(doctor)}
          className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug tracking-tight hover:text-brand-600 transition-colors cursor-pointer mt-3"
        >
          {doctor.name}
        </h3>

        {/* Specialty Badge (Below Name) */}
        <div className="mt-1.5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full max-w-full leading-relaxed">
            {doctor.specialization}
          </span>
        </div>

        {/* Experience */}
        <p className="text-xs font-semibold text-slate-600 mt-1.5">
          ⭐ {doctor.rating ? Number(doctor.rating).toFixed(1) : '4.9'} · {experienceText}
        </p>

        {/* 2. DOCTOR DETAILS */}
        <div className="border-t border-slate-100 my-4 pt-3.5 space-y-2 text-xs">
          
          {/* Hospital & Distance */}
          <div className="flex items-center justify-between gap-2 text-slate-800 font-bold">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="truncate text-slate-800 font-bold text-xs">{hospitalName}</span>
            </div>
            <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md shrink-0">
              {distanceText}
            </span>
          </div>

          {/* Languages */}
          <div className="flex items-center gap-1.5 text-slate-600 font-medium pt-0.5">
            <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600">🗣 {languagesList}</span>
          </div>
        </div>

        {/* 3. AVAILABILITY */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Next available today
          </span>
          <div className="flex flex-wrap gap-1.5">
            {slots.slice(0, 3).map((slot, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold bg-slate-100/90 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-xl hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition-colors cursor-pointer"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. FOOTER: Consultation Fee & Action Buttons */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-slate-500">Consultation fee:</span>
          <p className="text-base font-black text-slate-900">₹{doctor.consultationFee || 600}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectProfile && onSelectProfile(doctor)}
            className="bg-white hover:bg-slate-50 text-brand-700 border border-brand-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-2xs"
          >
            View Profile
          </button>
          <button
            type="button"
            onClick={() => onBookSlot && onBookSlot(doctor)}
            className="bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm shadow-brand-500/15 transition-all"
          >
            Book Slot
          </button>
        </div>
      </div>

    </div>
  );
};
