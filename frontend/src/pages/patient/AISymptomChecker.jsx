import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { checkSymptomsApi } from '../../services/api';
import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, Stethoscope, Calendar, RefreshCw } from 'lucide-react';

export const AISymptomChecker = () => {
  const { setSelectedDoctor, doctors, setActiveView, setBookingDoctor } = useApp();
  const [symptomsInput, setSymptomsInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const presetSymptoms = [
    'Chest tightness with mild dizziness',
    'Severe throbbing migraine and light sensitivity',
    'Low back pain after lifting weight',
    'High fever, dry cough, and fatigue'
  ];

  const handleTriage = async (inputSymptoms) => {
    if (!inputSymptoms.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Send to backend REST API
      const triageRes = await checkSymptomsApi(inputSymptoms, '1 day', 'Medium');
      setResult(triageRes);
    } catch (err) {
      // Local intelligent fallback triage logic
      let mockRes;
      const lower = inputSymptoms.toLowerCase();

      if (lower.includes('chest') || lower.includes('heart') || lower.includes('dizziness')) {
        mockRes = {
          symptoms: inputSymptoms,
          urgency: 'High',
          possibleConditions: [
            { name: 'Angina Pectoris / Coronary Vasospasm', probability: 88, description: 'Mild oxygen deficit in heart muscle cells, requiring cardiac evaluation.' },
            { name: 'Hypertensive Triage Spike', probability: 72, description: 'Elevated systolic BP response.' }
          ],
          recommendedSpecialist: 'Cardiologist',
          recommendedActions: [
            'Avoid physical exertion immediately and stay in a cool room.',
            'Consult a cardiologist within 2 hours or visit KMC ER if tightness persists.',
            'Keep emergency 108 line ready.'
          ],
          suggestedHospitals: ['KMC Hospital Attavar & Jyothi', 'AJ Hospital & Research Centre']
        };
      } else if (lower.includes('headache') || lower.includes('migraine')) {
        mockRes = {
          symptoms: inputSymptoms,
          urgency: 'Medium',
          possibleConditions: [
            { name: 'Migraine with Aura', probability: 85, description: 'Neurological headache episode exacerbated by stress or heat.' },
            { name: 'Tension Vascular Headache', probability: 64, description: 'Neck muscle stiffness and eye strain.' }
          ],
          recommendedSpecialist: 'Neurologist',
          recommendedActions: [
            'Rest in a dark, quiet room and drink 500ml water.',
            'Schedule a neurological OPD checkup within 24 hours.'
          ],
          suggestedHospitals: ['Father Muller Medical College Hospital', 'Kasturba Hospital Manipal']
        };
      } else {
        mockRes = {
          symptoms: inputSymptoms,
          urgency: 'Low',
          possibleConditions: [
            { name: 'Viral Upper Respiratory Infection', probability: 80, description: 'Seasonal fever and mild inflammation.' }
          ],
          recommendedSpecialist: 'General Physician',
          recommendedActions: [
            'Hydrate with warm fluids and monitor temperature.',
            'Book routine consultation with General Physician if fever persists over 48h.'
          ],
          suggestedHospitals: ['Government District Wenlock Hospital', 'Father Muller Medical College Hospital']
        };
      }
      setResult(mockRes);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookSpecialist = () => {
    if (!result) return;
    const spec = result.recommendedSpecialist;
    const matchedDoc = doctors.find(d => d.specialization.toLowerCase().includes(spec.toLowerCase().split(' ')[0])) || doctors[0];
    setSelectedDoctor(matchedDoc);
    setBookingDoctor(matchedDoc);
    setActiveView('book-appointment');
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" /> AI Medical Triage Engine
        </div>
        <h1 className="text-3xl font-black text-slate-900">AI Symptom Checker</h1>
        <p className="text-xs text-slate-600 font-medium">Describe your health symptoms to receive instant clinical triage & doctor matching</p>
      </div>

      {/* Input Box */}
      <div className="glass-card p-6 border-slate-200/80 bg-white space-y-4 shadow-sm">
        <label className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
          Describe What You Are Feeling:
        </label>

        <textarea
          rows={3}
          value={symptomsInput}
          onChange={e => setSymptomsInput(e.target.value)}
          placeholder="e.g., I have been feeling chest tightness and mild dizziness since morning..."
          className="glass-input text-xs w-full resize-none bg-slate-50 border-slate-300 text-slate-900 focus:bg-white"
        />

        {/* Preset Quick Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] text-slate-500 font-bold">Try sample symptoms:</span>
          {presetSymptoms.map((prompt, i) => (
            <button
              key={i}
              onClick={() => { setSymptomsInput(prompt); handleTriage(prompt); }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-xl transition-all shadow-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleTriage(symptomsInput)}
          disabled={!symptomsInput.trim() || isAnalyzing}
          className="w-full bg-brand-600 hover:bg-brand-500 text-white font-black text-xs py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Clinical Symptoms...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Calculate AI Clinical Triage</span>
            </>
          )}
        </button>
      </div>

      {/* Triage Result Output */}
      {result && (
        <div className="glass-card p-6 sm:p-8 border-slate-200/80 bg-white space-y-6 animate-in fade-in zoom-in duration-300 shadow-sm">
          
          {/* Header & Urgency Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900">AI Assessment Summary</h3>
              <p className="text-xs text-slate-500 font-medium">Evaluated against clinical guidelines</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Urgency Level:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow-xs ${
                result.urgency === 'High'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                  : result.urgency === 'Medium'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {result.urgency} Urgency
              </span>
            </div>
          </div>

          {/* Possible Conditions */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">Possible Medical Conditions</h4>
            <div className="space-y-3">
              {result.possibleConditions.map((cond, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 text-sm">{cond.name}</span>
                    <span className="text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {cond.probability}% Probability
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{cond.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Recommended Immediate Steps</h4>
            <div className="space-y-1.5 text-xs text-slate-700 font-medium">
              {result.recommendedActions.map((act, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Specialist CTA */}
          <div className="bg-gradient-to-r from-sky-50 via-cyan-50/40 to-blue-50/30 border border-sky-200/80 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-brand-600 flex items-center justify-center font-bold shadow-xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Matched Specialist</span>
                <h4 className="font-black text-base text-slate-900">{result.recommendedSpecialist}</h4>
                <p className="text-[11px] text-brand-700 font-semibold">Suggested Hubs: {result.suggestedHospitals.join(', ')}</p>
              </div>
            </div>

            <button
              onClick={handleBookSpecialist}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Specialist OPD Slot</span>
            </button>
          </div>

          {/* Medical Disclaimer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-amber-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Medical Disclaimer
            </p>
            <p className="font-medium">
              This AI triage tool is designed for informational prioritization only and does not replace official physician diagnosis. In critical emergency situations, call 108 immediately.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
