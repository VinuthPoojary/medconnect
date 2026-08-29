import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Filter, Star, Clock, MapPin, Languages, Calendar, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';
import { DoctorCard } from '../../components/ui/DoctorCard';

export const BookAppointment = () => {
  const { doctors, setSelectedDoctor, setActiveView, setBookingDoctor, bookingDoctor } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedSession, setSelectedSession] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  const specializations = [
    'All',
    'Cardiologist',
    'Neurologist',
    'Orthopedist',
    'Pediatrician',
    'Oncologist',
    'General Physician',
    'Dermatologist',
    'Gynecologist',
    'Ophthalmologist',
    'ENT Specialist',
    'Psychiatrist',
  ];
  const languages = ['All', 'Kannada', 'Tulu', 'Konkani', 'English', 'Hindi'];
  const sessions = [
    'All',
    'Morning (08:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 04:00 PM)',
    'Evening (04:00 PM - 09:00 PM)',
  ];

  const matchesSession = (slots, session) => {
    if (session === 'All' || !slots || slots.length === 0) return true;

    return slots.some(slot => {
      const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return true;
      let hour = parseInt(match[1], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;

      if (session === 'Morning (08:00 AM - 12:00 PM)') {
        return hour >= 8 && hour < 12;
      }
      if (session === 'Afternoon (12:00 PM - 04:00 PM)') {
        return hour >= 12 && hour < 16;
      }
      if (session === 'Evening (04:00 PM - 09:00 PM)') {
        return hour >= 16 && hour <= 21;
      }
      return true;
    });
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpec = selectedSpecialization === 'All' || doc.specialization === selectedSpecialization;
    const matchesLang = selectedLanguage === 'All' || (doc.languages && doc.languages.includes(selectedLanguage));
    const matchesTab = activeTab === 'all' || doc.isAvailableToday;
    const matchesTime = matchesSession(doc.availableSlots || [], selectedSession);

    return matchesSearch && matchesSpec && matchesLang && matchesTab && matchesTime;
  });

  const handleDoctorClick = (doc) => {
    setSelectedDoctor(doc);
    setActiveView('doctor-details');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Karavali Specialist Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Find & Book Top Doctors</h1>
          <p className="text-xs text-slate-400">Verified specialists in Mangaluru, Udupi & Manipal</p>
        </div>

        {/* Quick Filter Switch */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'all' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            All Doctors ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('available-today')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${activeTab === 'available-today' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Available Today
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search doctor, dept, or hospital..."
              className="glass-input text-xs w-full pl-10"
            />
          </div>

          {/* Specialization Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSpecialization}
              onChange={e => setSelectedSpecialization(e.target.value)}
              className="glass-input text-xs w-full bg-slate-950 text-slate-200"
            >
              {specializations.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Departments' : s}</option>
              ))}
            </select>
          </div>

          {/* Time Slot Session Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="glass-input text-xs w-full bg-slate-950 text-cyan-300 font-semibold"
            >
              {sessions.map(sess => (
                <option key={sess} value={sess}>{sess === 'All' ? '🕒 All Time Sessions' : `🕒 ${sess}`}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="glass-input text-xs w-full bg-slate-950 text-slate-200"
            >
              {languages.map(l => (
                <option key={l} value={l}>{l === 'All' ? 'Languages' : l}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Doctors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doc => (
          <DoctorCard
            key={doc.id}
            doctor={doc}
            onSelectProfile={(d) => handleDoctorClick(d)}
            onBookSlot={(d) => setBookingDoctor(d)}
          />
        ))}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}

    </div>
  );
};
