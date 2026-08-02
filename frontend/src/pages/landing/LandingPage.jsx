import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Calendar, ArrowRight, Shield, Award, Activity, FileText, BrainCircuit, Clock, MessageSquare, ChevronDown, HeartPulse, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage = () => {
  const { setRole, setActiveView } = useApp();
  const [openFaq, setOpenFaq] = useState(0);

  const stats = [
    { label: 'Verified Specialists', value: '100+', sub: 'Coastal Karnataka' },
    { label: 'Partner Hospitals', value: '50+', sub: 'Mangaluru & Udupi' },
    { label: 'Patient Consultations', value: '20K+', sub: 'AI Triage Handled' },
    { label: 'Satisfaction Rate', value: '98%', sub: 'Verified Reviews' },
  ];

  const features = [
    {
      title: 'AI Symptom Checker',
      desc: 'Instant diagnostic triage evaluating symptom severity (Low, Medium, High) with automatic doctor recommendations.',
      icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
      targetView: 'ai-symptom-checker',
      gradient: 'from-cyan-500/20 via-brand-500/10 to-transparent',
    },
    {
      title: 'Medical Report Analyzer',
      desc: 'Upload lab reports or PDFs and receive AI-generated summaries, highlighted key values, and risk flags.',
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      targetView: 'medical-reports',
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    },
    {
      title: 'Smart Doctor Match',
      desc: 'Personalized matching based on age, gender, medical history, location, and specialization suitability.',
      icon: <Bot className="w-6 h-6 text-brand-400" />,
      targetView: 'smart-recommendation',
      gradient: 'from-brand-500/20 via-cyan-500/10 to-transparent',
    },
    {
      title: 'AI Queue Predictor',
      desc: 'Real-time hospital queue position forecast, doctor consultation pace tracker, and wait-time countdown.',
      icon: <Clock className="w-6 h-6 text-amber-400" />,
      targetView: 'queue-prediction',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    },
    {
      title: 'Multilingual Assistant',
      desc: '24/7 ChatGPT-style health assistant fluent in Kannada, Tulu, Konkani, English, and Hindi.',
      icon: <MessageSquare className="w-6 h-6 text-violet-400" />,
      targetView: 'ai-chatbot',
      gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
    },
    {
      title: 'Health Dashboard',
      desc: 'Interactive health trends tracking blood pressure, sugar levels, BMI, heart rate, and AI lifestyle insights.',
      icon: <Activity className="w-6 h-6 text-rose-400" />,
      targetView: 'health-dashboard',
      gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    },
  ];

  const testimonials = [
    {
      name: 'Sharath Hegde',
      role: 'Patient • Mangaluru',
      comment: 'The AI Symptom Checker correctly suggested I consult a Neurologist at Yenepoya. Booked in 2 clicks with zero waiting!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Dr. Vignesh Shetty',
      role: 'Chief Cardiologist • KMC Health City',
      comment: 'MedConnect Karavali has revolutionized our OPD queue flow. Patients arrive with AI-summarized medical histories.',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    },
    {
      name: 'Preeti Shenoy',
      role: 'Patient • Udupi',
      comment: 'Uploading my blood test report gave me an instant breakdown in plain Kannada & English. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
  ];

  const faqs = [
    {
      q: 'How does the AI Symptom Checker work?',
      a: 'Our symptom triage model evaluates your symptoms against thousands of clinical guidelines to estimate risk levels (Low, Medium, High) and suggest the right super-specialist in coastal Karnataka.',
    },
    {
      q: 'Which hospitals in Mangaluru & Udupi are connected?',
      a: 'We are partnered with premier healthcare institutions including KMC Health City Mangaluru, Yenepoya AI Specialty Center, AJ Hospital, Father Muller Hub, and Kasturba Hospital Manipal.',
    },
    {
      q: 'Can I consult doctors online via telehealth video?',
      a: 'Yes! You can choose between in-person clinic visits or encrypted HD online telehealth video calls directly within MedConnect.',
    },
    {
      q: 'Is my medical data kept private and secure?',
      a: 'Absolute security is guaranteed. We follow HIPAA standards with end-to-end encryption for lab reports, patient histories, and consultations.',
    },
  ];

  const handleExplore = (target) => {
    setRole('patient');
    setActiveView(target);
  };

  return (
    <div className="min-h-screen text-slate-100 overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-4 lg:px-8 max-w-7xl mx-auto">
        
        {/* Glowing background graphics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/20 to-emerald-400/20 blur-3xl rounded-full pointer-events-none -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Next-Gen Healthcare for Coastal Karnataka</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
              AI-Powered <br />
              <span className="text-gradient">Smart Healthcare</span> <br />
              Platform
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Book appointments, analyze medical reports, find the right specialist, and experience intelligent healthcare powered by AI across Mangaluru, Udupi & Manipal.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => handleExplore('doctors')}
                className="bg-gradient-to-r from-brand-600 via-cyan-500 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-extrabold text-sm px-7 py-4 rounded-2xl shadow-xl shadow-brand-500/30 flex items-center gap-2 group transition-all hover:scale-105"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleExplore('ai-symptom-checker')}
                className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Explore AI Features</span>
              </button>
            </div>

            {/* Micro Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>24/7 Verified Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>NABH Accredited Hospitals</span>
              </div>
            </div>

          </div>

          {/* Right Visual Graphic */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto max-w-md"
            >
              {/* Glass Illustration Card */}
              <div className="glass-card p-6 border-cyan-500/30 glow-cyan relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>

                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      <HeartPulse className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Karavali Medical AI Core</h4>
                      <p className="text-[10px] text-emerald-400">● Live Triage Engine Active</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">v3.4 AI</span>
                </div>

                {/* Animated Widget Previews */}
                <div className="space-y-3">
                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Queue Waiting Forecast</p>
                        <p className="text-[10px] text-slate-400">Dr. Vignesh Shetty • KMC</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20">15 mins</span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">AI Symptom Confidence</p>
                        <p className="text-[10px] text-slate-400">Cardiology Referral Match</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">96.8% Match</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mangaluru • Udupi • Manipal</span>
                  <span className="text-cyan-400 font-semibold cursor-pointer hover:underline" onClick={() => handleExplore('ai-symptom-checker')}>Try AI Triage →</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Scrolling / Animated Statistics Bar */}
      <section className="bg-slate-900/60 border-y border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-1"
            >
              <h3 className="text-3xl lg-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {s.value}
              </h3>
              <p className="text-xs font-bold text-white">{s.label}</p>
              <p className="text-[11px] text-slate-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Intelligent Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything You Need for <span className="text-gradient">Smart Healthcare</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Designed for patients, doctors, and hospital administrators in coastal Karnataka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              onClick={() => handleExplore(feat.targetView)}
              className="glass-card glass-card-hover p-6 cursor-pointer relative group overflow-hidden border-slate-800"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feat.gradient} rounded-full blur-2xl pointer-events-none`}></div>

              <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>

              <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-between">
                <span>{feat.title}</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {feat.desc}
              </p>

              <span className="text-[11px] font-semibold text-cyan-400 group-hover:underline">
                Launch Module →
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-900/40 border-y border-white/5 py-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-white">Trusted by Thousands in Karavali</h2>
            <p className="text-xs text-slate-400">Real feedback from patients and healthcare professionals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-6 border-slate-800 flex flex-col justify-between">
                <p className="text-xs text-slate-300 italic leading-relaxed mb-6">"{t.comment}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-cyan-500/30" />
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.name}</h4>
                    <p className="text-[10px] text-cyan-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 px-4 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Everything you need to know about MedConnect Karavali</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-white hover:text-cyan-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === i ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-brand-900 via-cyan-900 to-emerald-950 border border-cyan-500/30 p-8 lg:p-12 rounded-3xl text-center space-y-6 relative overflow-hidden glow-blue">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ready for AI-Powered Healthcare?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Experience zero-wait doctor appointments, instant lab report summaries, and emergency 108 dispatch.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => { setRole('patient'); setActiveView('dashboard'); }}
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              Get Started
            </button>
            <button
              onClick={() => { setRole('hospital'); setActiveView('hospital-overview'); }}
              className="bg-slate-900 border border-white/20 text-white font-bold text-xs px-6 py-3.5 rounded-xl hover:bg-slate-850"
            >
              Hospital Portal Demo
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
