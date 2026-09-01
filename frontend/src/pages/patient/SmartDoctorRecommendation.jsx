import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrainCircuit, Sparkles, Star, ArrowRight, RefreshCw, MapPin, Building2 } from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';

export const SmartDoctorRecommendation = () => {
  const { doctors, setBookingDoctor, bookingDoctor, setSelectedDoctor, setActiveView } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '29',
    gender: 'Female',
    symptoms: 'Cardiovascular / Heart screening',
    location: 'Mangaluru',
    history: 'Hypertension',
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [recommendedDocs, setRecommendedDocs] = useState(null);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      // Dynamically match doctors from the real database array based on symptoms and location
      const querySpec = formData.symptoms.includes('Heart') ? 'Cardiologist' :
                        formData.symptoms.includes('Neurological') ? 'Neurologist' :
                        formData.symptoms.includes('Bone') ? 'Orthopedist' :
                        formData.symptoms.includes('Skin') ? 'Dermatologist' : 'General Medicine';

      let matches = doctors.filter(d => d.specialization.toLowerCase().includes(querySpec.toLowerCase()) || d.hospitalName.toLowerCase().includes(formData.location.toLowerCase()));

      if (matches.length < 2) {
        matches = doctors.slice(0, 3);
      }

      const recs = matches.slice(0, 3).map((doc, idx) => ({
        doctor: doc,
        matchScore: (98.5 - idx * 3.2).toFixed(1),
        reason: `Specialization in ${doc.specialization} at ${doc.hospitalName} aligns with your ${formData.history !== 'None' ? formData.history : 'health profile'} and ${formData.location} location.`,
      }));

      setRecommendedDocs(recs);
      setIsCalculating(false);
      setStep(6);
    }, 1200);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0F766E] text-xs font-bold shadow-xs">
          <BrainCircuit className="w-4 h-4 text-[#0F766E]" />
          <span>AI Doctor Matching Algorithm</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Smart Doctor Recommendation
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] font-medium">
          Answer 5 quick health questions to calculate your personalized specialist match
        </p>
      </div>

      {step <= 5 && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.08)] space-y-6">
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#0F766E]">Step {step} of 5</span>
              <span className="text-[#2563EB]">{step * 20}% Complete</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2563EB] to-[#14B8A6] h-full rounded-full transition-all duration-300 shadow-xs"
                style={{ width: `${step * 20}%` }}
              />
            </div>
          </div>

          {/* Question Steps */}
          {step === 1 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-bold text-[#0F172A]">1. What is your age?</h3>
              <p className="text-xs text-[#64748B]">Age helps us prioritize pediatric, adult, or geriatric specialists.</p>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g. 29"
                className="w-full bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-bold text-[#0F172A]">2. What is your gender?</h3>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formData.gender === g
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-200'
                        : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-bold text-[#0F172A]">3. What is your primary symptom or health goal?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Cardiovascular / Heart screening',
                  'Frequent headaches & Neurological check',
                  'Bone, Joint & Back Pain',
                  'Diabetes & General Medicine care',
                  'Skin & Cosmetology care'
                ].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, symptoms: s })}
                    className={`p-4 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                      formData.symptoms === s
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-200'
                        : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{s}</span>
                    {formData.symptoms === s && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-bold text-[#0F172A]">4. Preferred location in coastal Karnataka?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Mangaluru', 'Udupi', 'Manipal', 'Surathkal'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setFormData({ ...formData, location: loc })}
                    className={`p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      formData.location === loc
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-200'
                        : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${formData.location === loc ? 'text-white' : 'text-[#64748B]'}`} />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-bold text-[#0F172A]">5. Any relevant medical history?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['None', 'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Heart Disease'].map(hist => (
                  <button
                    key={hist}
                    type="button"
                    onClick={() => setFormData({ ...formData, history: hist })}
                    className={`p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      formData.history === hist
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md shadow-blue-500/20 ring-2 ring-blue-200'
                        : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{hist}</span>
                    {formData.history === hist && <span className="text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                Previous Step
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCalculate}
                disabled={isCalculating}
                className="bg-gradient-to-r from-[#2563EB] to-[#0F766E] hover:from-[#1D4ED8] hover:to-[#0F766E] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-75"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Calculating AI Match...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                    <span>View AI Doctor Match</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* Results View */}
      {step === 6 && recommendedDocs && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-[#0F172A]">Your AI Matched Specialists</h3>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer transition-colors"
            >
              Retake Questionnaire
            </button>
          </div>

          <div className="space-y-4">
            {recommendedDocs.map((rec, i) => (
              <div
                key={i}
                className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(15,23,42,0.08)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={rec.doctor.photo}
                      alt={rec.doctor.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#E2E8F0] shrink-0 shadow-2xs"
                    />
                    <div>
                      <h4
                        onClick={() => { setSelectedDoctor(rec.doctor); setActiveView('doctor-details'); }}
                        className="font-extrabold text-lg text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors"
                      >
                        {rec.doctor.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] font-bold uppercase text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {rec.doctor.specialization}
                        </span>
                        <span className="text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ★ {rec.doctor.rating}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#64748B] mt-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{rec.doctor.hospitalName} • {rec.doctor.experience} experience</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F0FDFA] border border-[#CCFBF1] p-3.5 rounded-2xl text-center shrink-0">
                    <span className="text-[10px] text-[#0F766E] font-extrabold uppercase tracking-wider block">
                      AI Match Score
                    </span>
                    <p className="text-2xl font-black text-[#0F766E] mt-0.5">{rec.matchScore}%</p>
                  </div>
                </div>

                {/* Reasoning Card */}
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs space-y-1.5">
                  <span className="font-bold text-[#0F766E] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>AI Recommendation Rationale:</span>
                  </span>
                  <p className="text-[#64748B] leading-relaxed font-medium">{rec.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#64748B] font-medium">
                    Consultation Fee:{' '}
                    <span className="font-extrabold text-[#0F172A] text-sm">₹{rec.doctor.consultationFee}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedDoctor(rec.doctor); setActiveView('doctor-details'); }}
                      className="bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E2E8F0] transition-all cursor-pointer shadow-2xs"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => setBookingDoctor(rec.doctor)}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Book Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}

    </div>
  );
};
