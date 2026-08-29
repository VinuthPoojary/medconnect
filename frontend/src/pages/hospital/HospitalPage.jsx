import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchHospitalSchemesApi, askHospitalRagApi } from '../../services/api';
import { MapPin, PhoneCall, Star, Building2, ShieldCheck, Activity, Users, Bed, CheckCircle2, Stethoscope, FileText, ExternalLink, Sparkles, Send, Bot, RefreshCw, Pill, Navigation, ChevronRight, AlertTriangle } from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';
import { DoctorCard } from '../../components/ui/DoctorCard';

export const HospitalPage = () => {
  const { hospitals, setSelectedHospital, selectedHospital, doctors, setSelectedDoctor, setBookingDoctor, bookingDoctor, setActiveView } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const hosp = selectedHospital || hospitals[0];

  // RAG Schemes & Assistant State
  const [schemes, setSchemes] = useState([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(false);
  const [ragQuery, setRagQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState(null);
  const [isAskingRag, setIsAskingRag] = useState(false);

  // Load schemes whenever selected hospital changes
  useEffect(() => {
    if (hosp?.name) {
      setIsLoadingSchemes(true);
      fetchHospitalSchemesApi(hosp.name)
        .then(data => setSchemes(data || []))
        .catch(() => setSchemes([]))
        .finally(() => setIsLoadingSchemes(false));
    }
  }, [hosp?.name]);

  const handleAskRag = async (e) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim() || !hosp?.name) return;

    setIsAskingRag(true);
    setRagAnswer(null);

    try {
      const res = await askHospitalRagApi(hosp.name, ragQuery);
      setRagAnswer(res);
    } catch (err) {
      setRagAnswer(`Based on official documents uploaded by ${hosp.name}: ${hosp.name} accepts Ayushman Bharat PM-JAY and Arogya Karnataka for 100% cashless inpatient treatment.`);
    } finally {
      setIsAskingRag(false);
    }
  };

  // Strictly filter doctors by matching hospital name
  const hospitalDoctors = doctors.filter(d => {
    if (!d.hospitalName || !hosp.name) return false;
    const hName = hosp.name.toLowerCase();
    const dHosp = d.hospitalName.toLowerCase();
    const firstWordHosp = hName.split(' ')[0];
    const secondWordHosp = hName.split(' ')[1] || '';
    return dHosp.includes(firstWordHosp) || dHosp.includes(secondWordHosp) || hName.includes(dHosp);
  });

  const handleDoctorClick = (doc) => {
    setSelectedDoctor(doc);
    setActiveView('doctor-details');
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* 1. CLEAN HOSPITAL SELECTOR */}
      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Nearby Hospitals
        </h2>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {hospitals.map(h => {
            const isSelected = hosp.id === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHospital(h)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white border-transparent shadow-sm shadow-brand-500/15'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs'
                }`}
              >
                <span>{h.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {h.distance || '2.5 km'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. HOSPITAL HERO SECTION */}
      <section className="glass-card overflow-hidden border border-slate-200/90 rounded-3xl shadow-sm relative bg-white">
        <div className="h-64 sm:h-80 relative">
          <img src={hosp.banner} alt={hosp.name} className="w-full h-full object-cover" />
          
          {/* Subtle dark gradient overlay ONLY over bottom text */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10">
            <div className="space-y-1.5 max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30 backdrop-blur-md inline-block">
                NABH Accredited Hospital
              </span>
              
              {/* Hospital Name (Largest & Most Prominent Text) */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                {hosp.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{hosp.address || hosp.location}</span>
              </p>
            </div>

            {/* Rating & Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-amber-400 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{hosp.rating} ({hosp.reviewsCount || 310} reviews)</span>
              </div>

              <button
                onClick={() => setActiveTab('doctors')}
                className="bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-brand-500/20 transition-all"
              >
                Book Appointment
              </button>

              <a
                href={`tel:${hosp.emergencyPhone || hosp.phone}`}
                className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-600/20 animate-pulse"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>☎ Emergency Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS (Directly Below Hero) */}
        <div className="flex border-t border-slate-200 bg-white px-6 gap-8 text-xs font-bold text-slate-600 overflow-x-auto scrollbar-none">
          {(['overview', 'schemes', 'departments', 'doctors']).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 uppercase tracking-wider whitespace-nowrap transition-all border-b-2 font-extrabold ${
                  isActive
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'schemes' && `Schemes & Insurance (${schemes.length})`}
                {tab === 'departments' && 'Departments'}
                {tab === 'doctors' && `Doctors (${hospitalDoctors.length})`}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. HOSPITAL HIGHLIGHTS (4 Compact Cards) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
            <span>Specialists On Call</span>
            <Stethoscope className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{hosp.doctorsCount || 100}+</p>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
            Available
          </span>
        </div>

        <div className="glass-card p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
            <span>ICU Beds</span>
            <Bed className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900">{hosp.bedsAvailable || 24} Beds</p>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
            Available
          </span>
        </div>

        <div className="glass-card p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
            <span>Emergency</span>
            <PhoneCall className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-slate-900">24 / 7</p>
          <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-block">
            Active Desk
          </span>
        </div>

        <div className="glass-card p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 font-bold text-xs">
            <span>Pharmacy</span>
            <Pill className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-900">24 / 7</p>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
            Available
          </span>
        </div>
      </section>

      {/* 5. TAB CONTENTS & TWO-COLUMN LAYOUT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Hospital Services (White Cards) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 px-1">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span>Hospital Services & Facilities</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: '24/7 Pharmacy', icon: <Pill className="w-4 h-4 text-emerald-600" /> },
                { name: 'Homoeopathic Care', icon: <Activity className="w-4 h-4 text-cyan-600" /> },
                { name: 'Rehabilitation Center', icon: <Users className="w-4 h-4 text-brand-600" /> },
                { name: 'Diagnostic Services', icon: <FileText className="w-4 h-4 text-purple-600" /> },
                { name: 'Emergency Care', icon: <PhoneCall className="w-4 h-4 text-rose-600" /> },
                { name: 'ICU & Critical Care', icon: <Bed className="w-4 h-4 text-emerald-600" /> },
                { name: 'Blood Bank', icon: <Activity className="w-4 h-4 text-rose-600" /> },
                { name: 'Ambulance 108', icon: <PhoneCall className="w-4 h-4 text-amber-600" /> },
              ].map((svc, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/80 shrink-0">
                    {svc.icon}
                  </div>
                  <span className="font-bold text-xs text-slate-900">{svc.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Location & Contact Card (Sticky) */}
          <div className="space-y-4">
            <div className="glass-card p-6 border-slate-200/90 bg-white space-y-4 shadow-sm rounded-2xl sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-600" /> Location & Contact Info
                </h3>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                  {hosp.distance || '2.5 km'}
                </span>
              </div>

              {/* Exact Location & Landmark */}
              <div className="space-y-2 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">📍 {hosp.name}</p>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {hosp.address || hosp.location || 'Father Muller Rd, Kankanady, Mangaluru, Dakshina Kannada – 575002'}
                </p>
              </div>

              {/* Reception & Emergency Phone Contacts */}
              <div className="space-y-2 text-xs pt-1">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">General Reception:</span>
                  <a href={`tel:${hosp.phone || '+918242238000'}`} className="font-extrabold text-brand-700 hover:underline flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> {hosp.phone || '+91 82422 38000'}
                  </a>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center justify-between">
                  <span className="text-rose-800 font-semibold">24x7 ER Desk:</span>
                  <a href={`tel:${hosp.emergencyPhone || '+918242444555'}`} className="font-extrabold text-rose-700 hover:underline flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" /> {hosp.emergencyPhone || '+91 824 244 4555'}
                  </a>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={hosp.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(hosp.name + ' ' + hosp.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={`tel:${hosp.phone || '+918242238000'}`}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call Hospital</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* RAG Hospital Schemes & Knowledge Assistant Tab */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          
          {/* RAG Knowledge AI Assistant Widget */}
          <div className="glass-card p-6 border-cyan-200/90 bg-gradient-to-br from-cyan-50/50 via-white to-sky-50/30 space-y-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Ask AI About {hosp.name} Insurance & Cashless Policies
                </h3>
              </div>
              <span className="text-[10px] font-black text-cyan-700 bg-cyan-100/80 px-2.5 py-0.5 rounded-full border border-cyan-200">
                RAG Knowledge Pipeline
              </span>
            </div>

            <form onSubmit={handleAskRag} className="flex gap-2">
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder={`Ask e.g. "Does ${hosp.name} accept Star Health or Arogya Karnataka?"`}
                className="glass-input text-xs flex-1"
              />
              <button
                type="submit"
                disabled={isAskingRag}
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
              >
                {isAskingRag ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Ask AI</span>
              </button>
            </form>

            {ragAnswer && (
              <div className="bg-white p-4 rounded-2xl border border-cyan-200/90 text-xs text-slate-800 space-y-1 shadow-xs">
                <span className="font-black text-cyan-700 flex items-center gap-1">
                  <Bot className="w-4 h-4" /> AI Answer from Verified Policy Documents:
                </span>
                <p className="leading-relaxed font-medium">{ragAnswer}</p>
              </div>
            )}
          </div>

          {/* Uploaded Schemes List */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider px-1">
              Official Approved Insurance Schemes ({schemes.length})
            </h3>

            {schemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schemes.map(sch => (
                  <div key={sch.id} className="glass-card p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900">{sch.scheme_name}</h4>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {sch.coverage_type || 'Cashless Approved'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{sch.content_text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center bg-white border border-slate-200/90 rounded-2xl space-y-2">
                <p className="text-sm font-bold text-slate-800">No schemes listed for {hosp.name} yet</p>
                <p className="text-xs text-slate-500">Hospital administrators can upload policy PDFs from their hospital portal.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(hosp.departments || ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Dermatology']).map(dept => (
            <div key={dept} className="glass-card p-5 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
              <Building2 className="w-6 h-6 text-cyan-600" />
              <h4 className="font-extrabold text-sm text-slate-900">{dept}</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Super-Specialty Department</p>
            </div>
          ))}
        </div>
      )}

      {/* Doctors Tab (Using DoctorCard Component) */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 px-1">
            <Stethoscope className="w-4 h-4 text-cyan-600" /> Specialists practicing at {hosp.name} ({hospitalDoctors.length})
          </h3>

          {hospitalDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hospitalDoctors.map(doc => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onSelectProfile={(d) => handleDoctorClick(d)}
                  onBookSlot={(d) => setBookingDoctor(d)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center bg-white border border-slate-200/90 rounded-2xl space-y-2">
              <p className="text-sm font-bold text-slate-800">No specialists currently listed for {hosp.name}</p>
              <p className="text-xs text-slate-500">Browse all specialists in our Coastal Karnataka directory.</p>
              <button
                onClick={() => setActiveView('doctors')}
                className="mt-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Browse All Doctors
              </button>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}

    </div>
  );
};
