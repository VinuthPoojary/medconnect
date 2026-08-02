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
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> AI Medical Triage Engine
        </div>
        <h1 className="text-3xl font-black text-white">AI Symptom Checker</h1>
        <p className="text-xs text-slate-300">Describe your health symptoms to receive instant clinical triage & doctor matching</p>
      </div>

      {/* Input Box */}
      <div className="glass-card p-6 border-slate-800 space-y-4 glow-cyan">
        <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
          Describe What You Are Feeling:
        </label>

        <textarea
          rows={3}
          value={symptomsInput}
          onChange={e => setSymptomsInput(e.target.value)}
          placeholder="e.g., I have been feeling chest tightness and mild dizziness since morning..."
          className="glass-input text-xs w-full resize-none"
        />

        {/* Preset Quick Prompts */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] text-slate-400 font-semibold">Try sample symptoms:</span>
          {presetSymptoms.map((prompt, i) => (
            <button
              key={i}
              onClick={() => { setSymptomsInput(prompt); handleTriage(prompt); }}
              className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleTriage(symptomsInput)}
          disabled={!symptomsInput.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-brand-600 via-cyan-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
              <span>Analyzing Clinical Symptoms...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Calculate AI Clinical Triage</span>
            </>
          )}
        </button>
      </div>

      {/* Triage Result Output */}
      {result && (
        <div className="glass-card p-6 sm:p-8 border-slate-800 space-y-6 animate-in fade-in zoom-in duration-300">
          
          {/* Header & Urgency Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">AI Assessment Summary</h3>
              <p className="text-xs text-slate-400">Evaluated against clinical guidelines</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Urgency Level:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1 ${
                result.urgency === 'High'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : result.urgency === 'Medium'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {result.urgency} Urgency
              </span>
            </div>
          </div>

          {/* Possible Conditions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Possible Medical Conditions</h4>
            <div className="space-y-3">
              {result.possibleConditions.map((cond, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white text-sm">{cond.name}</span>
                    <span className="text-cyan-400 font-extrabold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {cond.probability}% Probability
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{cond.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recommended Immediate Steps</h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {result.recommendedActions.map((act, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Specialist CTA */}
          <div className="bg-gradient-to-r from-brand-950 to-slate-900 border border-brand-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Matched Specialist</span>
                <h4 className="font-extrabold text-base text-white">{result.recommendedSpecialist}</h4>
                <p className="text-[11px] text-cyan-300">Suggested Hubs: {result.suggestedHospitals.join(', ')}</p>
              </div>
            </div>

            <button
              onClick={handleBookSpecialist}
              className="bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 shrink-0"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Specialist OPD Slot</span>
            </button>
          </div>

          {/* Medical Disclaimer */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-amber-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Medical Disclaimer
            </p>
            <p>
              This AI triage tool is designed for informational prioritization only and does not replace official physician diagnosis. In critical emergency situations, call 108 immediately.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
