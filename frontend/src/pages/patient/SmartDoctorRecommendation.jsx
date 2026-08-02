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
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
          <BrainCircuit className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> AI Doctor Matchmaking Algorithm
        </div>
        <h1 className="text-3xl font-black text-white">Smart Doctor Recommendation</h1>
        <p className="text-xs text-slate-300">Answer 5 quick health questions to calculate your personalized specialist match</p>
      </div>

      {step <= 5 && (
        <div className="glass-card p-8 border-slate-800 space-y-6 glow-cyan">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Step {step} of 5</span>
            <span>{step * 20}% Complete</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-brand-600 to-cyan-400 h-full transition-all duration-300" style={{ width: `${step * 20}%` }}></div>
          </div>

          {/* Question Steps */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">1. What is your age?</h3>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="glass-input text-sm w-full"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">2. What is your gender?</h3>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Other'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`p-4 rounded-2xl border text-xs font-bold transition-all ${
                      formData.gender === g ? 'bg-brand-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">3. What is your primary symptom or health goal?</h3>
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
                    className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                      formData.symptoms === s ? 'bg-brand-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">4. Preferred location in coastal Karnataka?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Mangaluru', 'Udupi', 'Manipal', 'Surathkal'].map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setFormData({ ...formData, location: loc })}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                      formData.location === loc ? 'bg-brand-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">5. Any relevant medical history?</h3>
              <div className="grid grid-cols-2 gap-3">
                {['None', 'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Heart Disease'].map(hist => (
                  <button
                    key={hist}
                    type="button"
                    onClick={() => setFormData({ ...formData, history: hist })}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                      formData.history === hist ? 'bg-brand-600 text-white border-cyan-400' : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {hist}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="bg-slate-950 text-slate-300 hover:text-white border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold"
              >
                Previous Step
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="bg-gradient-to-r from-brand-600 to-cyan-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Calculating AI Match...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
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
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Your AI Matched Specialists</h3>
            <button onClick={() => setStep(1)} className="text-xs text-cyan-400 hover:underline font-semibold">Retake Questionnaire</button>
          </div>

          <div className="space-y-4">
            {recommendedDocs.map((rec, i) => (
              <div key={i} className="glass-card p-6 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={rec.doctor.photo} alt={rec.doctor.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/30 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          {rec.doctor.specialization}
                        </span>
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          ★ {rec.doctor.rating}
                        </span>
                      </div>
                      <h4
                        onClick={() => { setSelectedDoctor(rec.doctor); setActiveView('doctor-details'); }}
                        className="font-bold text-base text-white mt-1 hover:text-cyan-300 cursor-pointer transition-colors"
                      >
                        {rec.doctor.name}
                      </h4>
                      <p className="text-xs text-slate-400">{rec.doctor.hospitalName} • {rec.doctor.experience} Exp.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-cyan-500/30 p-3.5 rounded-2xl text-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Match Score</span>
                    <p className="text-2xl font-black text-cyan-400">{rec.matchScore}%</p>
                  </div>
                </div>

                {/* Reasoning Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AI Recommendation Rationale:
                  </span>
                  <p className="leading-relaxed">{rec.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Consultation Fee: <span className="font-extrabold text-white">₹{rec.doctor.consultationFee}</span></span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedDoctor(rec.doctor); setActiveView('doctor-details'); }}
                      className="bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => setBookingDoctor(rec.doctor)}
                      className="bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
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
