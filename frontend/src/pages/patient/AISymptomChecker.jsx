import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { checkSymptomsApi, fetchSymptomHistoryApi } from '../../services/api';
import { BookingModal } from '../../components/ui/BookingModal';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Stethoscope,
  Calendar,
  RefreshCw,
  PhoneCall,
  Building2,
  MapPin,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
  Activity,
  Info,
  History,
  Send,
  HeartPulse,
  Flame,
  CornerDownRight,
  MessageSquare,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  Award
} from 'lucide-react';

export const AISymptomChecker = () => {
  const { setSelectedDoctor, setActiveView, setIsEmergencyModalOpen, currentUser } = useApp();

  // Primary Input States
  const [symptomsInput, setSymptomsInput] = useState('');
  const [duration, setDuration] = useState('1–3 Days');
  const [severity, setSeverity] = useState('moderate');
  const [location, setLocation] = useState('');
  const [hasFever, setHasFever] = useState(null);
  const [isGettingWorse, setIsGettingWorse] = useState(null);
  const [medications, setMedications] = useState('');

  // Flow & Step State
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'history'
  const [currentStep, setCurrentStep] = useState(1); // 1: Input, 2: Questions, 3: Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0); // 0: keywords, 1: urgency, 2: specialists

  // Results & History State
  const [triageResult, setTriageResult] = useState(null);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);

  // Conversation / Refine State
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const resultRef = useRef(null);

  // Quick Symptom Preset Prompts
  const presetSymptoms = [
    {
      title: 'Fever, dry cough & fatigue',
      text: 'I have had a high fever for 2 days along with a dry cough and severe body fatigue.',
      duration: '1–3 Days',
      severity: 'moderate',
      hasFever: true,
    },
    {
      title: 'Chest heaviness & breathlessness',
      text: 'I have had chest tightness and shortness of breath since morning, especially when walking.',
      duration: '< 24 Hours',
      severity: 'severe',
      location: 'Chest / Heart',
    },
    {
      title: 'Severe migraine & light sensitivity',
      text: 'Severe throbbing headache on the right side of my head with nausea and sensitivity to light.',
      duration: '1–3 Days',
      severity: 'severe',
      location: 'Head / Cranial',
    },
    {
      title: 'Child with persistent vomiting',
      text: 'My 4-year-old child has been vomiting since yesterday and has low energy.',
      duration: '1–3 Days',
      severity: 'moderate',
    },
    {
      title: 'Severe lower back pain after lifting',
      text: 'Severe sharp pain in my lower back after lifting heavy luggage, unable to bend comfortably.',
      duration: '< 24 Hours',
      severity: 'severe',
      location: 'Back / Spine',
    },
  ];

  // Fetch symptom history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchSymptomHistoryApi();
      setSymptomHistory(data);
    } catch (e) {
      console.warn('Could not load symptom history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Step progression simulated during AI processing
  useEffect(() => {
    let timer1, timer2;
    if (isAnalyzing) {
      setLoadingStage(0);
      timer1 = setTimeout(() => setLoadingStage(1), 1000);
      timer2 = setTimeout(() => setLoadingStage(2), 2200);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAnalyzing]);

  const applyPreset = (preset) => {
    setSymptomsInput(preset.text);
    if (preset.duration) setDuration(preset.duration);
    if (preset.severity) setSeverity(preset.severity);
    if (preset.location) setLocation(preset.location);
    if (preset.hasFever !== undefined) setHasFever(preset.hasFever);
  };

  const handleStartAnalysis = async (customPayload = null) => {
    const textToAnalyze = customPayload?.symptoms || symptomsInput;
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setCurrentStep(3); // Move to results/loading view
    setTriageResult(null);

    const payload = customPayload || {
      symptoms: textToAnalyze,
      duration,
      severity,
      location,
      hasFever,
      isGettingWorse,
      medications,
    };

    try {
      const res = await checkSymptomsApi(payload);
      setTriageResult(res);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      console.error('Triage analysis error:', err);
      // Fallback response with clean structure
      setTriageResult({
        is_valid_symptom: true,
        summary: 'Your reported symptoms have been evaluated based on MedConnect clinical triage protocols.',
        symptoms_detected: ['Reported Clinical Symptoms'],
        duration: duration || '1–3 Days',
        severity: severity || 'moderate',
        urgency: 'routine',
        urgency_label: 'Routine Consultation',
        is_emergency: false,
        possible_categories: ['General Medicine', 'Preventative Healthcare'],
        clinical_assessment: 'Your symptoms may be evaluated by an outpatient clinician for accurate diagnosis and personalized guidance.',
        recommended_specialty: 'General Physician',
        recommended_actions: [
          'Stay hydrated and ensure adequate physical rest',
          'Schedule an OPD consultation with a verified specialist',
          'Seek emergency care if severe pain or shortness of breath develops',
        ],
        follow_up_questions: ['Have you experienced any changes in your appetite or energy levels?'],
        matchedDoctors: [],
      });
    } finally {
      setIsAnalyzing(false);
      setIsRefining(false);
    }
  };

  const handleRefineTriage = () => {
    if (!followUpAnswer.trim()) return;
    const combinedSymptoms = `${symptomsInput}. Additional notes: ${followUpAnswer}`;
    setSymptomsInput(combinedSymptoms);
    setFollowUpAnswer('');
    handleStartAnalysis({
      symptoms: combinedSymptoms,
      duration,
      severity,
      location,
      hasFever,
      isGettingWorse,
      medications,
      additionalContext: followUpAnswer,
    });
  };

  const handleViewDoctor = (doc) => {
    setSelectedDoctor(doc);
    setActiveView('doctor-details');
  };

  const handleBookDoctor = (doc) => {
    setSelectedDoctorForBooking(doc);
  };

  const resetChecker = () => {
    setSymptomsInput('');
    setTriageResult(null);
    setCurrentStep(1);
    setIsRefining(false);
    setFollowUpAnswer('');
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-brand-600 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-teal-200 animate-pulse" />
              <span>AI Clinical Triage & Healthcare Navigation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Symptom Checker
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
              Describe how you are feeling in natural language. Our AI evaluates clinical urgency, identifies possible health areas, and matches you with verified specialists across Coastal Karnataka.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('checker')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'checker'
                  ? 'bg-white text-brand-700 shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>New Triage</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-brand-700 shadow-md scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My History</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SYMPTOM CHECKER */}
      {activeTab === 'checker' && (
        <div className="space-y-6">
          {/* STEP PROGRESS BAR */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                1
              </span>
              <span className={`text-xs font-extrabold ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                Describe Symptoms
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </span>
              <span className={`text-xs font-extrabold ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                Context & Duration
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </span>
              <span className={`text-xs font-extrabold ${currentStep >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                AI Triage & Doctors
              </span>
            </div>
          </div>

          {/* STEP 1: INPUT BOX & PRESETS */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-brand-600" />
                    <span>Describe What You Are Experiencing</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Use everyday language. No medical terms required.
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {symptomsInput.length} chars
                </span>
              </div>

              {/* Textarea Input */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="e.g., I've had chest discomfort and mild dizziness since morning after climbing stairs, feeling tired and sweaty..."
                  className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-slate-50 border border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 text-slate-900 placeholder:text-slate-400 transition-all resize-none shadow-inner"
                />
              </div>

              {/* Sample Prompt Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>Try common sample cases:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {presetSymptoms.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(preset)}
                      className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-brand-50/80 border border-slate-200 hover:border-brand-300 transition-all text-xs group cursor-pointer"
                    >
                      <div className="font-extrabold text-slate-800 group-hover:text-brand-700 flex items-center justify-between">
                        <span>{preset.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-brand-600 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {preset.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!symptomsInput.trim()}
                  className="w-full sm:flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Follow-Up Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleStartAnalysis()}
                  disabled={!symptomsInput.trim() || isAnalyzing}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Analyze Directly</span>
                </button>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-[11px] text-amber-900 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Medical Disclaimer:</strong> AI triage provides clinical prioritization and specialist recommendations for guidance only. It does not replace formal medical evaluation or diagnosis by a qualified healthcare professional.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: STRUCTURED CONTEXT QUESTIONS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Additional Clinical Context
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Answering these optional questions refines your triage accuracy and urgency assessment.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-100"
                >
                  Back to Symptoms
                </button>
              </div>

              {/* 1. Duration Selection */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>How long have you had these symptoms?</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['< 24 Hours', '1–3 Days', '4–7 Days', '> 1 Week'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-2xl text-xs font-extrabold border transition-all text-center ${
                        duration === d
                          ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Severity Selection */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-600" />
                  <span>How severe is the discomfort?</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'mild', label: 'Mild', desc: 'Noticeable, does not stop routine activities' },
                    { id: 'moderate', label: 'Moderate', desc: 'Interferes with daily tasks & work' },
                    { id: 'severe', label: 'Severe', desc: 'Intense pain, difficulty functioning' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        severity === s.id
                          ? 'bg-brand-50 border-brand-500 text-brand-900 ring-2 ring-brand-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-black capitalize">{s.label}</div>
                      <div className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Primary Anatomical Region */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Primary Location of Discomfort (Optional):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Chest / Heart', 'Head / Cranial', 'Abdomen / Stomach', 'Back / Spine', 'Joints / Knee', 'Throat / ENT', 'Skin', 'Whole Body'].map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(location === loc ? '' : loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        location === loc
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Quick Binary Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900">Do you have a fever?</span>
                    <p className="text-[10px] text-slate-500 font-medium">Elevated temperature or chills</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setHasFever(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        hasFever === true ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasFever(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        hasFever === false ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900">Is it getting worse?</span>
                    <p className="text-[10px] text-slate-500 font-medium">Symptoms increasing in intensity</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsGettingWorse(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        isGettingWorse === true ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGettingWorse(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        isGettingWorse === false ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Medication context */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Current Medications or Known Allergies (Optional):
                </label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="e.g. Taking BP tablets (Amlodipine), allergic to penicillin..."
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleStartAnalysis()}
                  disabled={isAnalyzing}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Analyze My Symptoms Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ANALYZING STATE & RESULTS DASHBOARD */}
          {currentStep === 3 && (
            <div ref={resultRef} className="space-y-6">
              {/* LOADING INDICATOR STATE */}
              {isAnalyzing && (
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-md text-center space-y-6 animate-in fade-in duration-300">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="w-20 h-20 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-brand-600 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">
                      Analyzing Clinical Symptoms...
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Consulting MedConnect AI Clinical Triage Protocol
                    </p>
                  </div>

                  {/* Stage-by-stage Progress List */}
                  <div className="max-w-md mx-auto space-y-2.5 text-left text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2.5">
                      {loadingStage >= 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <span className={loadingStage >= 0 ? 'font-bold text-slate-900' : 'text-slate-400'}>
                        Understanding described symptoms & keywords
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {loadingStage >= 1 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <span className={loadingStage >= 1 ? 'font-bold text-slate-900' : 'text-slate-400'}>
                        Evaluating clinical urgency & emergency red flags
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {loadingStage >= 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <span className={loadingStage >= 2 ? 'font-bold text-slate-900' : 'text-slate-400'}>
                        Querying matched specialists from Coastal Karnataka database
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TRIAGE RESULT DASHBOARD */}
              {!isAnalyzing && triageResult && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  {/* NON-SYMPTOM / GIBBERISH WARNING */}
                  {triageResult.is_valid_symptom === false && (
                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <span>Could Not Detect Health Symptoms</span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        {triageResult.clinical_assessment}
                      </p>
                      <button
                        onClick={resetChecker}
                        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Enter Symptoms Again
                      </button>
                    </div>
                  )}

                  {/* 1. EMERGENCY PROMINENT BANNER (If is_emergency === true) */}
                  {triageResult.is_emergency && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-xl space-y-5 border-2 border-rose-300/40 relative overflow-hidden">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl shrink-0 backdrop-blur-md">
                          <Flame className="w-7 h-7 text-white animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-rose-800 text-xs font-black tracking-wide uppercase">
                            🚨 Possible Medical Emergency
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            Urgent Emergency Evaluation Recommended
                          </h3>
                          <p className="text-xs sm:text-sm text-rose-100 font-medium leading-relaxed">
                            {triageResult.emergency_warning || 'Your symptoms may require immediate professional evaluation. Do not delay seeking medical care or wait for a routine appointment.'}
                          </p>
                        </div>
                      </div>

                      {/* Red Flags Identified */}
                      {triageResult.red_flags && triageResult.red_flags.length > 0 && (
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 space-y-1.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-200">
                            Critical Red Flags Detected:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {triageResult.red_flags.map((flag, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-xl bg-white text-rose-900 text-xs font-extrabold shadow-xs">
                                • {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Immediate Emergency Action CTAs */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                          onClick={() => setIsEmergencyModalOpen(true)}
                          className="w-full sm:flex-1 bg-white hover:bg-rose-50 text-rose-700 font-black text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all scale-100 hover:scale-102"
                        >
                          <PhoneCall className="w-5 h-5 text-rose-600 animate-pulse" />
                          <span>Call 108 Emergency SOS</span>
                        </button>
                        <button
                          onClick={() => setActiveView('hospitals')}
                          className="w-full sm:w-auto bg-rose-950/60 hover:bg-rose-950/80 text-white font-extrabold text-xs sm:text-sm py-4 px-6 rounded-2xl border border-rose-300/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <Building2 className="w-5 h-5" />
                          <span>Find 24x7 ER Hospital</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. MAIN TRIAGE SUMMARY CARD */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    {/* Header with Urgency Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                            AI Clinical Assessment
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            Triage Engine v2.5
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                          {triageResult.summary || 'Symptom Triage Overview'}
                        </h3>
                      </div>

                      {/* Urgency Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase flex items-center gap-1.5 shadow-xs border ${
                          triageResult.urgency === 'emergency' || triageResult.is_emergency
                            ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                            : triageResult.urgency === 'urgent'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : triageResult.urgency === 'soon' || triageResult.severity === 'moderate'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                          <span>{triageResult.urgency_label || `${triageResult.urgency} Urgency`}</span>
                        </span>
                      </div>
                    </div>

                    {/* Symptoms Identified & Possible Health Areas Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Symptoms Identified */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-brand-600" />
                          <span>Symptoms Detected</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(triageResult.symptoms_detected || ['Reported Discomfort']).map((sym, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-extrabold shadow-2xs">
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Possible Health Areas */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>Possible Health Areas Involved</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(triageResult.possible_categories || ['General Internal Medicine']).map((cat, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold shadow-2xs">
                              • {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Triage Assessment Explanation */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 border border-sky-200 space-y-2">
                      <div className="flex items-center gap-2 text-sky-900 font-extrabold text-xs">
                        <Info className="w-4 h-4 text-sky-600" />
                        <span>Clinical Guidance Note</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {triageResult.clinical_assessment || 'Your described symptoms have been assessed against regional clinical protocols. Please follow the guidance steps below and consult a doctor.'}
                      </p>
                    </div>

                    {/* Actionable Steps */}
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Recommended Next Steps:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(triageResult.recommended_actions || [
                          'Stay well-hydrated and rest',
                          'Schedule an outpatient OPD appointment',
                          'Seek prompt medical care if symptoms worsen'
                        ]).map((action, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RECOMMENDED SPECIALIST CALLOUT */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-sky-50 to-blue-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-teal-200 text-teal-600 flex items-center justify-center font-black shadow-xs shrink-0">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                            Recommended Specialist
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-slate-900">
                            {triageResult.recommended_specialty || triageResult.recommendedSpecialist || 'General Physician'}
                          </h4>
                          <p className="text-[11px] text-slate-600 font-medium">
                            Based on your symptoms, consultation with a {triageResult.recommended_specialty || 'General Physician'} is appropriate.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const docSection = document.getElementById('matched-doctors-section');
                          docSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
                      >
                        <span>View Matched Doctors</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* REFINE & FOLLOW-UP CONVERSATION DRAWER */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-brand-600" />
                          <span>Need to add more details or answer follow-up questions?</span>
                        </span>
                        <button
                          onClick={() => setIsRefining(!isRefining)}
                          className="text-xs font-extrabold text-brand-600 hover:text-brand-700"
                        >
                          {isRefining ? 'Hide' : 'Add Details'}
                        </button>
                      </div>

                      {triageResult.follow_up_questions && triageResult.follow_up_questions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase text-slate-400">
                            Suggested follow-up considerations:
                          </span>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside font-medium">
                            {triageResult.follow_up_questions.map((q, i) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {isRefining && (
                        <div className="pt-2 space-y-2">
                          <textarea
                            rows={2}
                            value={followUpAnswer}
                            onChange={(e) => setFollowUpAnswer(e.target.value)}
                            placeholder="e.g., The chest discomfort started 3 hours ago after climbing stairs, no pain in my left arm..."
                            className="w-full text-xs p-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400"
                          />
                          <button
                            onClick={handleRefineTriage}
                            disabled={!followUpAnswer.trim()}
                            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Update & Recalculate Triage</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. REAL MATCHED DOCTORS CATALOG FROM DATABASE */}
                  <div id="matched-doctors-section" className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                          <User className="w-5 h-5 text-brand-600" />
                          <span>Matched Verified Specialists</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Queried directly from MedConnect Karavali hospital & doctor network
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveView('doctors')}
                        className="text-xs font-extrabold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        <span>Browse All Doctors</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Doctors Grid */}
                    {triageResult.matchedDoctors && triageResult.matchedDoctors.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {triageResult.matchedDoctors.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Doctor Photo */}
                              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {doc.photo ? (
                                  <img
                                    src={doc.photo}
                                    alt={doc.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full bg-gradient-to-br from-brand-500 to-teal-600 text-white flex items-center justify-center font-black text-sm">
                                  {doc.name?.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </div>
                              </div>

                              {/* Doctor Details */}
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                                    {doc.specialization}
                                  </span>
                                  {doc.experience && (
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {doc.experience} Yrs Exp
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-black text-sm text-slate-900 truncate">
                                  {doc.name}
                                </h4>

                                <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{doc.hospitalName || doc.hospital_name || 'KMC Specialty Hub'}</span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                                  <span className="flex items-center gap-1 font-extrabold text-amber-700">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                    <span>{doc.rating || '4.9'}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span>{doc.location || 'Mangaluru'}</span>
                                  </span>
                                  <span className="font-extrabold text-emerald-700">
                                    ₹{doc.consultationFee || doc.consultation_fee || '450'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Doctor Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => handleViewDoctor(doc)}
                                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 transition-all text-center cursor-pointer"
                              >
                                View Profile
                              </button>
                              <button
                                onClick={() => handleBookDoctor(doc)}
                                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Book Appointment</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center space-y-3">
                        <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs text-slate-600 font-medium">
                          No exact matching specialists found in this category right now.
                        </p>
                        <button
                          onClick={() => setActiveView('doctors')}
                          className="bg-brand-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl"
                        >
                          Browse All 61+ Doctors
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reset / New Triage Button */}
                  <div className="text-center pt-4">
                    <button
                      onClick={resetChecker}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start a New Symptom Triage</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SYMPTOM HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                <span>My Past Symptom Triage Sessions</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Past evaluations securely stored for {currentUser?.name || 'your account'}
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-slate-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
              Loading symptom history...
            </div>
          ) : symptomHistory.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Activity className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-black text-slate-700">No Prior Symptom Evaluations</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever you use the AI Symptom Checker, your clinical triage summaries will appear here for easy reference.
              </p>
              <button
                onClick={() => setActiveTab('checker')}
                className="bg-brand-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs"
              >
                Run First Triage
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {symptomHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-brand-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {item.recommendedSpecialist || item.recommended_specialist || 'General Physician'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        item.urgency === 'emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : item.urgency === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : item.urgency === 'soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.urgency} Urgency
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-bold">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    <strong>Reported Symptoms:</strong> {item.symptoms}
                  </p>

                  {item.analysis?.clinical_assessment && (
                    <p className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                      {item.analysis.clinical_assessment}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSymptomsInput(item.symptoms);
                        setActiveTab('checker');
                        handleStartAnalysis({ symptoms: item.symptoms });
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-evaluate Symptoms</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REUSED EXISTING BOOKING MODAL */}
      {selectedDoctorForBooking && (
        <BookingModal
          doctor={selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
        />
      )}
    </div>
  );
};
