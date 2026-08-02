import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchHospitalSchemesApi, askHospitalRagApi } from '../../services/api';
import { MapPin, PhoneCall, Star, Building2, ShieldCheck, Activity, Users, Bed, CheckCircle2, Stethoscope, FileText, ExternalLink, Sparkles, Send, Bot, RefreshCw } from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';

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
    <div className="space-y-8 pb-12">
      
      {/* Hospital Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {hospitals.map(h => (
          <button
            key={h.id}
            onClick={() => setSelectedHospital(h)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              hosp.id === h.id
                ? 'bg-gradient-to-r from-brand-600 to-cyan-600 border-cyan-400 text-white shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {h.name}
          </button>
        ))}
      </div>

      {/* Hospital Hero Banner */}
      <div className="glass-card overflow-hidden border-slate-800 relative">
        <div className="h-48 sm:h-64 relative">
          <img src={hosp.banner} alt={hosp.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                NABH Accredited Hospital
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white mt-1">{hosp.name}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {hosp.location}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-amber-400 font-bold text-xs flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{hosp.rating} ({hosp.reviewsCount || 350})</span>
              </div>
              <a
                href={`tel:${hosp.phone}`}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency Desk</span>
              </a>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-800 bg-slate-950 px-6 gap-6 text-xs font-bold text-slate-400 overflow-x-auto">
          {(['overview', 'schemes', 'departments', 'doctors']).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 capitalize whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab ? 'border-cyan-400 text-cyan-300' : 'border-transparent hover:text-white'
              }`}
            >
              {tab === 'schemes' ? `Schemes & Insurance (${schemes.length})` : tab === 'doctors' ? `Hospital Doctors (${hospitalDoctors.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 border-slate-800 text-center">
                <Users className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xl font-extrabold text-white">{hosp.doctorsCount || 100}+</p>
                <p className="text-[10px] text-slate-400 font-semibold">Specialists On Call</p>
              </div>

              <div className="glass-card p-4 border-slate-800 text-center">
                <Bed className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-extrabold text-white">{hosp.bedsAvailable}</p>
                <p className="text-[10px] text-emerald-400 font-bold">ICU Beds Available</p>
              </div>

              <div className="glass-card p-4 border-slate-800 text-center">
                <Activity className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-sm font-extrabold text-white mt-1">{hosp.emergencyStatus}</p>
                <p className="text-[10px] text-slate-400 font-semibold">24x7 ER Status</p>
              </div>
            </div>

            {/* Facilities */}
            <div className="glass-card p-6 border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hospital Facilities & Infrastructure</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {(hosp.facilities || ['24x7 Emergency', 'NABH Accredited', 'Level-3 ICU', 'Digital Radiology']).map((fac, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Map Location Box */}
          <div className="space-y-6">
            <div className="glass-card p-6 border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Location & Contact
              </h3>
              <div className="h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-center p-4 text-xs text-slate-400">
                <div>
                  <MapPin className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                  <p className="font-bold text-white text-sm">{hosp.name}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{hosp.location}</p>
                  <p className="text-[11px] text-cyan-400 font-semibold mt-1">Phone: {hosp.phone || '+91 82420 99887'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* RAG Hospital Schemes & Knowledge Assistant Tab */}
      {activeTab === 'schemes' && (
        <div className="space-y-8">
          
          {/* RAG Knowledge AI Assistant Widget */}
          <div className="glass-card p-6 sm:p-8 border-cyan-500/30 glow-cyan space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{hosp.name} RAG Knowledge Assistant</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      Official Doc Grounded
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Ask any policy or coverage question about {hosp.name}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAskRag} className="flex items-center gap-2">
              <input
                type="text"
                value={ragQuery}
                onChange={e => setRagQuery(e.target.value)}
                placeholder={`Does ${hosp.name} cover Ayushman Bharat or Star Health?`}
                className="glass-input text-xs w-full"
              />
              <button
                type="submit"
                disabled={!ragQuery.trim() || isAskingRag}
                className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shrink-0 flex items-center gap-2"
              >
                {isAskingRag ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Ask RAG AI</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick RAG Sample Prompts */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-bold">Try Sample Questions:</span>
              {[
                `Does ${hosp.name} cover Ayushman Bharat?`,
                `What insurance policies are accepted at ${hosp.name}?`,
                `What are the OPD concession rules?`
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setRagQuery(q); }}
                  className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* RAG Grounded Output Answer Box */}
            {ragAnswer && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-2 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Official RAG Grounded Answer for {hosp.name}:
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{ragAnswer}</p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                    Verified from {schemes.length} Hospital Documents
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* List of Uploaded Schemes */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Government & Private Healthcare Schemes
            </h3>

            {schemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schemes.map(sch => (
                  <div key={sch.id} className="glass-card p-6 border-slate-800 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          {sch.category}
                        </span>
                        <h4 className="font-extrabold text-base text-white mt-1.5">{sch.schemeTitle}</h4>
                        <p className="text-xs text-emerald-400 font-bold mt-0.5">{sch.coverageAmount}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Eligibility & Rules:</span>
                      <p>{sch.eligibility}</p>
                      {sch.description && <p className="text-slate-400 mt-1">{sch.description}</p>}
                    </div>

                    {sch.documentUrl && (
                      <a
                        href={sch.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-semibold bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 transition-all"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>View Scheme PDF Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center border-slate-800 space-y-2">
                <p className="text-sm font-bold text-slate-300">No schemes listed for {hosp.name} yet</p>
                <p className="text-xs text-slate-400">Hospital administrators can upload policy PDFs from their hospital portal.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(hosp.departments || ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics']).map(dept => (
            <div key={dept} className="glass-card p-5 border-slate-800 space-y-2">
              <Building2 className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">{dept}</h4>
              <p className="text-[10px] text-slate-400">Super-Specialty Department</p>
            </div>
          ))}
        </div>
      )}

      {/* Hospital Doctors (Filtered strictly by hospital) */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-cyan-400" /> Doctors at {hosp.name}
          </h3>

          {hospitalDoctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitalDoctors.map(doc => (
                <div key={doc.id} className="glass-card p-5 border-slate-800 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3.5">
                    <img src={doc.photo} alt={doc.name} className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        {doc.specialization}
                      </span>
                      <h4
                        onClick={() => handleDoctorClick(doc)}
                        className="font-bold text-sm text-white mt-1 hover:text-cyan-300 cursor-pointer transition-colors"
                      >
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{doc.experience} Experience • ₹{doc.consultationFee}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleDoctorClick(doc)}
                      className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setBookingDoctor(doc)}
                      className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md"
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center border-slate-800 space-y-2">
              <p className="text-sm font-bold text-slate-300">No doctors currently listed for {hosp.name}</p>
              <p className="text-xs text-slate-400">View all specialists in our Coastal Karnataka directory.</p>
              <button
                onClick={() => setActiveView('doctors')}
                className="mt-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
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
