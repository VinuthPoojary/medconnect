import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchHospitalSchemesApi, createHospitalSchemeApi, deleteHospitalSchemeApi, fetchLiveQueueApi, addDoctorByHospitalApi } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Building2, Stethoscope, Users, Bed, DollarSign, Plus, Trash2, Sparkles, Search, FileText, ShieldCheck, Upload, ExternalLink, Activity } from 'lucide-react';

export const HospitalDashboard = () => {
  const { doctors, appointments, addDoctor, deleteDoctor, currentUser } = useApp();
  const hospitalName = currentUser?.hospitalName || 'KMC Hospital Attavar & Jyothi';
  
  const [tab, setTab] = useState('overview');
  const [searchDoctor, setSearchDoctor] = useState('');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState(false);

  // Live Queue State from Supabase PostgreSQL
  const [liveQueue, setLiveQueue] = useState([]);

  // Schemes State for RAG
  const [schemes, setSchemes] = useState([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(false);

  // New Doctor Full Credentials State (Requirement 1)
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('Cardiologist');
  const [newDocQual, setNewDocQual] = useState('MBBS, MD');
  const [newDocExp, setNewDocExp] = useState('8 Years');
  const [newDocLicense, setNewDocLicense] = useState('KA-MED-10024');
  const [newDocPassword, setNewDocPassword] = useState('');

  // New Scheme RAG State
  const [schemeTitle, setSchemeTitle] = useState('');
  const [category, setCategory] = useState('Government Scheme');
  const [coverageAmount, setCoverageAmount] = useState('Up to ₹5,00,000 / Family');
  const [eligibility, setEligibility] = useState('BPL Card Holders & ABHA ID Verified');
  const [description, setDescription] = useState('');
  const [contentText, setContentText] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const loadLiveQueue = async () => {
    try {
      const data = await fetchLiveQueueApi('', hospitalName, '');
      if (data && data.length > 0) {
        setLiveQueue(data);
      } else {
        setLiveQueue(appointments);
      }
    } catch (err) {
      setLiveQueue(appointments);
    }
  };

  useEffect(() => {
    loadLiveQueue();
    const timer = setInterval(loadLiveQueue, 2000);
    return () => clearInterval(timer);
  }, [hospitalName, appointments]);

  const loadSchemes = async () => {
    setIsLoadingSchemes(true);
    try {
      const data = await fetchHospitalSchemesApi(hospitalName);
      setSchemes(data);
    } catch (err) {
      console.warn('Failed to fetch schemes:', err.message);
    } finally {
      setIsLoadingSchemes(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [hospitalName]);

  const handleAddScheme = async (e) => {
    e.preventDefault();
    if (!schemeTitle.trim()) return;

    try {
      const newSch = await createHospitalSchemeApi({
        hospitalName,
        schemeTitle,
        category,
        coverageAmount,
        eligibility,
        description,
        documentUrl: documentUrl || 'https://medconnect.karavali.ai/docs/hospital-scheme-policy.pdf',
        contentText: contentText || description || `${schemeTitle} rules and 100% cashless coverage at ${hospitalName}.`,
      });

      setSchemes(prev => [newSch, ...prev]);
      setSchemeTitle('');
      setDescription('');
      setContentText('');
      setDocumentUrl('');
      setShowAddSchemeModal(false);
    } catch (err) {
      alert('Failed to upload scheme: ' + err.message);
    }
  };

  const handleDeleteScheme = async (id) => {
    try {
      await deleteHospitalSchemeApi(id);
      setSchemes(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete scheme: ' + err.message);
    }
  };

  const diseaseData = [
    { disease: 'Hypertension', count: 140 },
    { disease: 'Type 2 Diabetes', count: 98 },
    { disease: 'Migraine', count: 65 },
    { disease: 'Asthma / Respiratory', count: 52 },
    { disease: 'Orthopedic Trauma', count: 41 },
  ];

  const peakHoursData = [
    { hour: '09 AM', patients: 45 },
    { hour: '11 AM', patients: 82 },
    { hour: '01 PM', patients: 38 },
    { hour: '04 PM', patients: 64 },
    { hour: '06 PM', patients: 29 },
  ];


  const filteredDocs = doctors.filter(d => d.name.toLowerCase().includes(searchDoctor.toLowerCase()) || d.specialization.toLowerCase().includes(searchDoctor.toLowerCase()));

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const email = newDocEmail || `dr.${newDocName.toLowerCase().replace(/[^a-z]/g, '')}@medconnect.com`;
    const phone = newDocPhone || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const pass = newDocPassword || 'Doctor@2026';

    const doctorData = {
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      email,
      phone,
      specialization: newDocSpec,
      qualification: newDocQual,
      experience: newDocExp,
      licenseNumber: newDocLicense,
      password: pass,
      hospitalName,
      consultationFee: 750,
    };

    try {
      const res = await addDoctorByHospitalApi(doctorData);
      const created = res.doctor || doctorData;

      const newDoc = {
        id: created.id || `doc-${Date.now()}`,
        name: created.name || doctorData.name,
        photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
        specialization: newDocSpec,
        experience: newDocExp,
        rating: 4.9,
        reviewsCount: 1,
        languages: ['Kannada', 'English', 'Tulu'],
        availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM'],
        hospitalName,
        location: 'Mangaluru',
        distance: '2.5 km',
        consultationFee: 750,
        education: newDocQual,
        bio: `Consultant ${newDocSpec} at ${hospitalName}.`,
        isAvailableToday: true,
      };

      addDoctor(newDoc);
      alert(`🎉 Doctor Account Registered Successfully!\n\nName: ${newDoc.name}\nEmail: ${email}\nInitial Password: ${pass}\n\nThe doctor can now log in at Doctor Login.`);
      setNewDocName('');
      setNewDocEmail('');
      setNewDocPhone('');
      setShowAddDocModal(false);
    } catch (err) {
      alert('Failed to register doctor account: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" /> {hospitalName} Admin Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Hospital Management Portal</h1>
          <p className="text-xs text-slate-400">OPD Queue analytics, doctor roster, and RAG document scheme management</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${tab === 'overview' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab('schemes')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${tab === 'schemes' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> RAG Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setTab('doctors')}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${tab === 'doctors' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Doctors ({doctors.length})
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1 ${tab === 'analytics' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Analytics
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {tab === 'overview' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="glass-card p-5 border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Today's OPD Patients</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">284</p>
              <p className="text-[10px] text-emerald-400 font-bold">↑ 14% vs yesterday</p>
            </div>

            <div className="glass-card p-5 border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Active Hospital Schemes</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{schemes.length}</p>
              <p className="text-[10px] text-emerald-400 font-bold">RAG Document Grounded</p>
            </div>

            <div className="glass-card p-5 border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">ICU Bed Occupancy</span>
                <Bed className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">78%</p>
              <p className="text-[10px] text-amber-400 font-bold">48 Beds Free</p>
            </div>

            <div className="glass-card p-5 border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Active Doctors</span>
                <Stethoscope className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{doctors.length}</p>
              <p className="text-[10px] text-cyan-400 font-bold">All OPDs Active</p>
            </div>

          </div>

          {/* Today's Appointments Queue Table */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Current Patient Queue (Supabase PostgreSQL Live)</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> Live Realtime
                </span>
              </h3>
              <span className="text-xs text-slate-400">Ordered by booking timestamp (created_at ASC)</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Queue Pos</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Assigned Doctor</th>
                    <th className="p-3">Slot Time</th>
                    <th className="p-3">Queue Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(liveQueue.length > 0 ? liveQueue : appointments).map((apt, index) => (
                    <tr key={apt.id || index} className="hover:bg-slate-900/50">
                      <td className="p-3">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-extrabold text-xs border border-cyan-500/30">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{apt.patientName || 'Kavya Poojary'}</td>
                      <td className="p-3 text-cyan-400 font-medium">{apt.doctorName}</td>
                      <td className="p-3 text-slate-300 font-semibold">{apt.timeSlot}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          BOOKED (Pos #{index + 1})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </div>
      )}

      {/* RAG Schemes & Policy Manager Tab */}
      {tab === 'schemes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>RAG Hospital Knowledge & Insurance Schemes</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  Google Gemini Grounded
                </span>
              </h3>
              <p className="text-xs text-slate-400">Upload hospital policy documents, insurance coverage rules, and FAQs for AI RAG answers.</p>
            </div>

            <button
              onClick={() => setShowAddSchemeModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Scheme Policy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schemes.map(sch => (
              <div key={sch.id} className="glass-card p-6 border-slate-800 space-y-4 glow-cyan">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {sch.category}
                    </span>
                    <h4 className="font-extrabold text-base text-white mt-1.5">{sch.schemeTitle}</h4>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5">{sch.coverageAmount}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteScheme(sch.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 bg-slate-950 rounded-xl hover:bg-slate-900 shrink-0"
                    title="Remove Scheme Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-semibold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Scheme PDF Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Doctors View */}
      {tab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchDoctor}
                onChange={e => setSearchDoctor(e.target.value)}
                placeholder="Search hospital doctor roster..."
                className="glass-input text-xs w-full pl-10"
              />
            </div>

            <button
              onClick={() => setShowAddDocModal(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="glass-card p-5 border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={doc.photo} alt={doc.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-white">{doc.name}</h4>
                    <p className="text-xs text-cyan-400">{doc.specialization}</p>
                    <p className="text-[10px] text-slate-400">₹{doc.consultationFee} Fee</p>
                  </div>
                </div>

                <button
                  onClick={() => deleteDoctor(doc.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 bg-slate-950 rounded-xl hover:bg-slate-900"
                  title="Remove Doctor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital AI Analytics */}
      {tab === 'analytics' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Diseases Chart */}
            <div className="glass-card p-6 border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white">Most Common OPD Diagnoses</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diseaseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="disease" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Chart */}
            <div className="glass-card p-6 border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white">Hospital Peak OPD Volume Hours</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="patients" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* AI Insights Card */}
          <div className="glass-card p-6 border-slate-800 bg-gradient-to-r from-brand-950 to-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Hospital AI Predictive Forecast
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Expect a 22% surge in Cardiology consultations this Wednesday morning. Recommended action: Allocate 2 additional support nurses to OPD Room #304.
            </p>
          </div>

        </div>
      )}

      {/* Add Scheme Modal (RAG Upload) */}
      {showAddSchemeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4">
            <h3 className="font-bold text-base text-white">Upload New Hospital Scheme / Policy PDF</h3>

            <form onSubmit={handleAddScheme} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Scheme / Policy Title</label>
                <input
                  type="text"
                  value={schemeTitle}
                  onChange={e => setSchemeTitle(e.target.value)}
                  placeholder="e.g., Ayushman Bharat PM-JAY 100% Cashless Coverage"
                  className="glass-input text-xs w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Scheme Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="glass-input text-xs w-full bg-slate-950 text-slate-200"
                  >
                    <option value="Government Scheme">Government Scheme</option>
                    <option value="Private Insurance">Private Insurance</option>
                    <option value="Hospital Policy">Hospital Policy</option>
                    <option value="FAQ / Guidelines">FAQ / Guidelines</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Coverage Amount</label>
                  <input
                    type="text"
                    value={coverageAmount}
                    onChange={e => setCoverageAmount(e.target.value)}
                    placeholder="Up to ₹5,00,000 / Family"
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 mb-1 block">Eligibility Criteria</label>
                <input
                  type="text"
                  value={eligibility}
                  onChange={e => setEligibility(e.target.value)}
                  placeholder="BPL Card Holders & ABHA ID Verified Patients"
                  className="glass-input text-xs w-full"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 mb-1 block">Scheme Document PDF URL</label>
                <input
                  type="text"
                  value={documentUrl}
                  onChange={e => setDocumentUrl(e.target.value)}
                  placeholder="https://medconnect.karavali.ai/docs/policy.pdf"
                  className="glass-input text-xs w-full"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 mb-1 block">Official Policy Text & Details (Used for Gemini RAG AI)</label>
                <textarea
                  rows={3}
                  value={contentText}
                  onChange={e => setContentText(e.target.value)}
                  placeholder="Enter full scheme rules, empanelled procedures, and pre-authorization instructions..."
                  className="glass-input text-xs w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSchemeModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Save to RAG Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4">
            <h3 className="font-bold text-sm text-white">Add Doctor to Roster</h3>

            <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Doctor Full Name *</label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    placeholder="Dr. Vignesh Shetty"
                    className="glass-input text-xs w-full"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    value={newDocEmail}
                    onChange={e => setNewDocEmail(e.target.value)}
                    placeholder="vignesh.shetty@medconnect.com"
                    className="glass-input text-xs w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Mobile Number *</label>
                  <input
                    type="text"
                    value={newDocPhone}
                    onChange={e => setNewDocPhone(e.target.value)}
                    placeholder="+91 94481 22334"
                    className="glass-input text-xs w-full"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Password *</label>
                  <input
                    type="password"
                    value={newDocPassword}
                    onChange={e => setNewDocPassword(e.target.value)}
                    placeholder="Enter password"
                    className="glass-input text-xs w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Specialization *</label>
                  <select
                    value={newDocSpec}
                    onChange={e => setNewDocSpec(e.target.value)}
                    className="glass-input text-xs w-full bg-slate-950 text-slate-200"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Dermatologist & Cosmetologist">Dermatologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="General Physician">General Physician</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Qualification</label>
                  <input
                    type="text"
                    value={newDocQual}
                    onChange={e => setNewDocQual(e.target.value)}
                    placeholder="MBBS, MD"
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Experience</label>
                  <input
                    type="text"
                    value={newDocExp}
                    onChange={e => setNewDocExp(e.target.value)}
                    placeholder="8 Years"
                    className="glass-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 mb-1 block">Medical Registration / License #</label>
                  <input
                    type="text"
                    value={newDocLicense}
                    onChange={e => setNewDocLicense(e.target.value)}
                    placeholder="KA-MED-10024"
                    className="glass-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg"
                >
                  Create & Register Doctor Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
