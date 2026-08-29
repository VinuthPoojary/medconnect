import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingModal } from '../../components/ui/BookingModal';
import {
  Stethoscope,
  Building2,
  Clock,
  Calendar,
  Search,
  Activity,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Star,
  FileText,
  UserCheck,
  ChevronRight,
  HeartPulse,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const LandingPage = () => {
  const { doctors = [], hospitals = [], setActiveView, setIsEmergencyModalOpen } = useApp();
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);

  // Search Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveView('doctors');
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 space-y-16 pb-20 overflow-x-hidden font-sans">
      
      {/* ==========================================
          1. HERO SECTION (Clean 2-Column Desktop Layout)
         ========================================== */}
      <section className="pt-8 sm:pt-12 pb-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headline & Primary Action */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Location Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/90 text-brand-700 text-xs font-black shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>📍 Mangaluru • Udupi • Manipal</span>
            </div>

            {/* Main Headline (Healthcare, connected to you) */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Healthcare, <br className="hidden sm:block" />
              <span className="text-brand-600">connected to you.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
              Find trusted doctors, book appointments, track your queue in real time, and manage your health — all in one place.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('doctors')}
                className="bg-gradient-to-r from-brand-600 to-teal-600 hover:from-brand-700 hover:to-teal-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Find a Doctor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView('hospitals')}
                className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-2xs transition-all cursor-pointer"
              >
                Explore Hospitals
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-extrabold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" /> 100% Verified Specialists
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Real-Time OPD Queue Tracking
              </span>
            </div>

          </div>

          {/* Right Column: Real-Time OPD Patient Queue Card Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/60 space-y-5 relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      YOUR APPOINTMENT
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Dr. Vignesh Shetty</h3>
                    <p className="text-xs font-semibold text-slate-500 truncate">Cardiologist • KMC Hospital</p>
                  </div>
                </div>
                
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Live Queue
                </span>
              </div>

              {/* Time Session */}
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 bg-slate-50 p-2.5 rounded-xl">
                <span>📅 Today · 09:30 AM Session</span>
                <span className="text-brand-700">In-Person OPD</span>
              </div>

              {/* Real-time Queue Indicator Token Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Your Token</span>
                  <p className="text-2xl font-black text-brand-700">#07</p>
                </div>
                <div className="space-y-1 border-x border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Token</span>
                  <p className="text-2xl font-black text-slate-900">#04</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Patients Ahead</span>
                  <p className="text-2xl font-black text-slate-900">2</p>
                </div>
              </div>

              {/* Wait Time Indicator */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> Estimated wait ~20 minutes
                </span>
                <span className="font-extrabold text-emerald-700">🟢 Live Tracker</span>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* ==========================================
          2. QUICK SEARCH PANEL (Prominent Interactive Component)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-lg shadow-slate-200/50 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Find the right doctor</h2>
              <p className="text-xs text-slate-500 font-semibold">Search by doctor name, medical specialty, or hospital in Coastal Karnataka</p>
            </div>
            <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200 self-start sm:self-auto">
              Real-time Availability
            </span>
          </div>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            
            {/* Input 1: Search Query */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor name, specialty, or hospital..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
              />
            </div>

            {/* Input 2: Location Select */}
            <div className="lg:col-span-3">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
              >
                <option value="All">📍 All Coastal Karnataka</option>
                <option value="Mangaluru">Mangaluru</option>
                <option value="Udupi">Udupi</option>
                <option value="Manipal">Manipal</option>
              </select>
            </div>

            {/* Input 3: Specialization Select */}
            <div className="lg:col-span-2">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-600 focus:bg-white transition-all"
              >
                <option value="All">🩺 All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Doctors</span>
              </button>
            </div>

          </form>
        </div>
      </section>


      {/* ==========================================
          3. QUICK ACTIONS (4 Equal Clean Cards)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Core Healthcare Services
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={() => setActiveView('doctors')}
            className="bg-white border border-slate-200/90 hover:border-brand-300 p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">Find a Doctor</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Browse verified specialists and book appointments</p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('hospitals')}
            className="bg-white border border-slate-200/90 hover:border-teal-300 p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-600 transition-colors">Find a Hospital</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Explore NABH-accredited nearby hospitals</p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('appointments')}
            className="bg-white border border-slate-200/90 hover:border-emerald-300 p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">Track My Queue</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">See your live token and estimated wait time</p>
            </div>
          </div>

          <div
            onClick={() => setActiveView('medical-reports')}
            className="bg-white border border-slate-200/90 hover:border-cyan-300 p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-cyan-600 transition-colors">Medical Reports</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Upload lab results for intelligent explanations</p>
            </div>
          </div>

        </div>
      </section>


      {/* ==========================================
          4. LIVE QUEUE FEATURE SECTION (Hero Feature Highlight)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Explanation */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Unique Feature Highlight
            </span>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
              No more waiting blindly.
            </h2>

            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Track your position in the doctor's clinic queue in real time from your mobile phone.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-extrabold text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatically updates when your doctor completes a consultation — no page refresh needed.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Get estimated waiting times calculated dynamically in real time.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Receive instant notification alerts when your turn is approaching.</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => setActiveView('appointments')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-xs transition-all"
              >
                Track Your Queue Ticket Live →
              </button>
            </div>
          </div>

          {/* Right Visual OPD Queue Simulation */}
          <div className="lg:col-span-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">DR. VIGNESH SHETTY</h4>
                <p className="text-[11px] text-slate-500 font-semibold">CARDIOLOGIST • OPD QUEUE</p>
              </div>
              <span className="text-xs font-black text-brand-700 bg-white px-3 py-1 rounded-full border border-slate-200">
                Current Token #04
              </span>
            </div>

            {/* Queue List Simulation */}
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-200/60 text-slate-500">
                <span>✓ #01 Patient</span>
                <span className="text-[10px] text-slate-400">Completed</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-200/60 text-slate-500">
                <span>✓ #02 Patient</span>
                <span className="text-[10px] text-slate-400">Completed</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-200/60 text-slate-500">
                <span>✓ #03 Patient</span>
                <span className="text-[10px] text-slate-400">Completed</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-brand-600 text-white font-black shadow-xs">
                <span>🔵 #04 Patient</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">In Consultation</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-slate-800 border border-slate-200">
                <span>🟢 #05 Patient</span>
                <span className="text-[10px] text-emerald-700 font-bold">Waiting</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white text-slate-800 border border-slate-200">
                <span>🟢 #06 Patient</span>
                <span className="text-[10px] text-emerald-700 font-bold">Waiting</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-brand-50 border border-brand-300 text-brand-900 font-black">
                <span>⭐ #07 YOU</span>
                <span className="text-[10px] bg-brand-200/80 px-2 py-0.5 rounded text-brand-800">Your Reserved Token</span>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span>Patients ahead: 2</span>
              <span>Estimated wait: ~20 min</span>
              <span className="text-emerald-700">● Live Queue</span>
            </div>
          </div>

        </div>
      </section>


      {/* ==========================================
          5. DOCTORS SECTION (Find Trusted Specialists)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Find trusted specialists</h2>
            <p className="text-xs text-slate-500 font-semibold">Verified doctors in Mangaluru, Udupi & Manipal</p>
          </div>
          <button
            onClick={() => setActiveView('doctors')}
            className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Doctors ({doctors.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.slice(0, 6).map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={doc.photo}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                  />
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                      {doc.specialization}
                    </span>
                    
                    {/* DEDICATED DOCTOR NAME ROW */}
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug truncate">
                      {doc.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{doc.rating || '4.9'}</span>
                      <span className="text-slate-400">• ({doc.experience || '12'} yrs exp)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-semibold pt-1">
                  <p className="flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.hospitalName}</span>
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      🟢 Available Today
                    </span>
                    <span className="font-extrabold text-slate-900">
                      From ₹{doc.consultationFee || 750}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveView('doctors')}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForBooking(doc)}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  Book Slot
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>


      {/* ==========================================
          6. HOSPITALS SECTION (Hospitals Near You)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Hospitals near you</h2>
            <p className="text-xs text-slate-500 font-semibold">Leading medical college hospitals & specialty clinics</p>
          </div>
          <button
            onClick={() => setActiveView('hospitals')}
            className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Explore All Hospitals</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(hospitals.length > 0 ? hospitals : [
            {
              id: 'hosp-1',
              name: 'Father Muller Medical College Hospital',
              location: 'Kankanady, Mangaluru',
              image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
              accreditation: 'NABH Accredited',
              emergency: '🟢 Emergency Available',
            },
            {
              id: 'hosp-2',
              name: 'KMC Hospital, Manipal & Attavar',
              location: 'Manipal & Mangaluru',
              image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
              accreditation: 'NABH Accredited',
              emergency: '🟢 Emergency Available',
            },
            {
              id: 'hosp-3',
              name: 'AJ Hospital & Research Centre',
              location: 'Kuntikana, Mangaluru',
              image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
              accreditation: 'NABH Accredited',
              emergency: '🟢 Emergency Available',
            }
          ]).slice(0, 3).map((hosp) => (
            <div
              key={hosp.id}
              className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="h-40 relative">
                <img
                  src={hosp.image || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80'}
                  alt={hosp.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-brand-700 shadow-2xs">
                  {hosp.accreditation || 'NABH Accredited'}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {hosp.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hosp.location || 'Mangaluru'}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    🟢 Emergency 24/7
                  </span>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => setActiveView('hospitals')}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  View Hospital Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ==========================================
          7. AI HEALTHCARE ASSISTANCE SECTION (Assistive AI Benefits)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Intelligent Assistance
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Healthcare, with intelligent assistance
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              AI tools to help you understand symptoms, translate reports, and find the right doctors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div
              onClick={() => setActiveView('ai-symptom-checker')}
              className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3 cursor-pointer hover:border-brand-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-100/80 text-brand-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">AI Symptom Checker</h3>
              <p className="text-xs text-slate-500 font-medium">Describe your symptoms to receive instant AI triage guidance.</p>
            </div>

            <div
              onClick={() => setActiveView('medical-reports')}
              className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3 cursor-pointer hover:border-teal-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-600 transition-colors">Medical Report Analysis</h3>
              <p className="text-xs text-slate-500 font-medium">Upload medical PDFs to get clear, plain-English explanations.</p>
            </div>

            <div
              onClick={() => setActiveView('ai-symptom-checker')}
              className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3 cursor-pointer hover:border-emerald-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">AI Health Assistant</h3>
              <p className="text-xs text-slate-500 font-medium">Ask health questions and get answers based on medical guidelines.</p>
            </div>

            <div
              onClick={() => setActiveView('doctors')}
              className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-3 cursor-pointer hover:border-cyan-300 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-cyan-600 transition-colors">Smart Doctor Matching</h3>
              <p className="text-xs text-slate-500 font-medium">Get matched with top-rated specialists suited to your medical condition.</p>
            </div>

          </div>

          <div className="bg-brand-50 border border-brand-200 p-3.5 rounded-2xl text-xs text-brand-900 font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-600 shrink-0" />
            <span>AI features provide educational guidance and do not replace professional medical diagnosis or doctor consultations.</span>
          </div>

        </div>
      </section>


      {/* ==========================================
          8. MEDICAL REPORTS (Understand Your Lab Reports)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Understand your medical reports
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Upload blood tests, lab reports, or imaging results to get an instant, plain-English summary highlighting normal vs abnormal values.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-[11px]">1</span>
                <span>Upload Report PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-[11px]">2</span>
                <span>AI Scans Document</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-[11px]">3</span>
                <span>Highlights Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-black text-[11px]">4</span>
                <span>Easy Explanation</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveView('medical-reports')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-xs transition-all"
              >
                Analyze a Medical Report →
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-900">Sample Report Scan</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">All Clear</span>
            </div>
            <p className="font-extrabold text-slate-800">Complete Blood Count (CBC)</p>
            <p className="text-slate-600 font-medium">Hemoglobin: 14.2 g/dL (Normal reference: 12.0–15.5 g/dL)</p>
            <p className="text-slate-600 font-medium">WBC Count: 6,800 /mcL (Normal reference: 4,500–11,000 /mcL)</p>
          </div>

        </div>
      </section>


      {/* ==========================================
          9. CONTROLLED EMERGENCY SECTION (Red Used Strictly for Emergency)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-100 bg-white/20 px-3 py-1 rounded-full">
              24/7 Emergency Support
            </span>
            <h2 className="text-2xl font-black pt-1">Need emergency medical help?</h2>
            <p className="text-xs text-rose-100 font-medium">Call 108 for immediate ambulance services or find nearby emergency trauma centers.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="bg-white text-rose-700 hover:bg-rose-50 font-black text-xs px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Call 108 Emergency</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('hospitals')}
              className="bg-rose-700/80 hover:bg-rose-800 text-white font-extrabold text-xs px-5 py-3 rounded-2xl border border-rose-400 transition-all cursor-pointer"
            >
              Find Emergency Hospitals
            </button>
          </div>

        </div>
      </section>


      {/* ==========================================
          10. HOW MEDCONNECT WORKS (4 Simple Steps)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Healthcare made simple</h2>
          <p className="text-xs text-slate-500 font-semibold">How MedConnect Karavali works in 4 easy steps</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          
          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl space-y-2 shadow-2xs">
            <span className="text-brand-600 font-black text-lg block">01 — Find</span>
            <h3 className="font-extrabold text-sm text-slate-900">Search Specialists</h3>
            <p className="text-xs text-slate-500 font-medium">Find doctors and hospitals near you in Coastal Karnataka.</p>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl space-y-2 shadow-2xs">
            <span className="text-brand-600 font-black text-lg block">02 — Book</span>
            <h3 className="font-extrabold text-sm text-slate-900">Select OPD Session</h3>
            <p className="text-xs text-slate-500 font-medium">Choose a doctor, date, and preferred time session.</p>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl space-y-2 shadow-2xs">
            <span className="text-brand-600 font-black text-lg block">03 — Track</span>
            <h3 className="font-extrabold text-sm text-slate-900">Get Queue Token</h3>
            <p className="text-xs text-slate-500 font-medium">Receive your token number and track your position live.</p>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-2xl space-y-2 shadow-2xs">
            <span className="text-brand-600 font-black text-lg block">04 — Consult</span>
            <h3 className="font-extrabold text-sm text-slate-900">Visit Doctor</h3>
            <p className="text-xs text-slate-500 font-medium">Visit the consultation room right as your turn approaches.</p>
          </div>

        </div>
      </section>


      {/* ==========================================
          11. TRUST SECTION (Why MedConnect Karavali?)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/50 space-y-6 text-center">
          <h2 className="text-2xl font-black text-slate-900">Why MedConnect Karavali?</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-extrabold text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>Verified Doctors</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>NABH Hospitals</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>Live OPD Queue</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>Secure Reports</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>Assistive AI Triage</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="block text-brand-600 text-lg mb-1">✓</span>
              <span>Coastal Karnataka</span>
            </div>
          </div>
        </div>
      </section>


      {/* ==========================================
          BOOKING MODAL OVERLAY
         ========================================== */}
      {selectedDoctorForBooking && (
        <BookingModal
          doctor={selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
        />
      )}

    </div>
  );
};
