import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchHospitalProfileApi,
  fetchHospitalMetricsApi,
  fetchHospitalDoctorsApi,
  createHospitalDoctorApi,
  updateHospitalDoctorApi,
  deleteHospitalDoctorApi,
  fetchHospitalAppointmentsApi,
  fetchHospitalPatientsApi,
  fetchHospitalDocumentsApi,
  uploadHospitalDocumentApi,
  deleteHospitalDocumentApi
} from '../../services/api';
import {
  Hospital,
  Building2,
  LayoutDashboard,
  User,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  IndianRupee,
  GraduationCap,
  FileCheck,
  Mail,
  Phone,
  Lock,
  Copy,
  ExternalLink,
  Upload,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Sparkles,
  Bed,
  Activity,
  Award,
  Layers,
  Search,
  Check
} from 'lucide-react';

export const HospitalDashboard = () => {
  const { currentUser, isAuthenticated, hospitalLogout, setActiveView } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [hospitalData, setHospitalData] = useState(null);
  const [metrics, setMetrics] = useState({
    doctorsCount: 0,
    appointmentsCount: 0,
    patientsCount: 0,
    documentsCount: 0
  });

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Doctor Form Modal State
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDoctorCreds, setNewDoctorCreds] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    registrationNumber: '',
    specialization: 'General Medicine',
    email: '',
    phone: '',
    qualification: 'MBBS, MD',
    experienceYears: 5,
    consultationFee: 400,
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: ['09:00 AM - 01:00 PM', '04:00 PM - 07:00 PM']
  });

  // Document Upload Form Modal State
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Services',
    version: '1.0',
    summary: '',
    extractedText: ''
  });

  // Auth Guard
  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'hospital') {
      setActiveView('hospital-login');
      try {
        window.history.pushState({}, '', '/hospital/login');
      } catch (e) {}
    }
  }, [isAuthenticated, currentUser, setActiveView]);

  // Load All Hospital Data
  const loadHospitalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const [profileRes, metricsRes, docsRes, apptsRes, patsRes, documentsRes] = await Promise.all([
        fetchHospitalProfileApi().catch(() => null),
        fetchHospitalMetricsApi().catch(() => null),
        fetchHospitalDoctorsApi().catch(() => []),
        fetchHospitalAppointmentsApi().catch(() => []),
        fetchHospitalPatientsApi().catch(() => []),
        fetchHospitalDocumentsApi().catch(() => [])
      ]);

      if (profileRes) setHospitalData(profileRes);
      if (metricsRes) setMetrics(metricsRes);
      if (Array.isArray(docsRes)) setDoctors(docsRes);
      if (Array.isArray(apptsRes)) setAppointments(apptsRes);
      if (Array.isArray(patsRes)) setPatients(patsRes);
      if (Array.isArray(documentsRes)) setDocuments(documentsRes);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load hospital data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'hospital') {
      loadHospitalData();
    }
  }, [isAuthenticated, currentUser, loadHospitalData]);

  // Add Doctor Handler
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      setIsActionLoading(true);
      setErrorMessage('');
      const res = await createHospitalDoctorApi(doctorForm);
      if (res && res.doctor) {
        setDoctors((prev) => [res.doctor, ...prev]);
        setMetrics((prev) => ({ ...prev, doctorsCount: (prev.doctorsCount || 0) + 1 }));
        setNewDoctorCreds({
          name: res.doctor.name,
          email: res.doctor.email,
          temporaryPassword: res.temporaryPassword,
          loginUrl: window.location.origin + '/doctor/login'
        });
        setShowAddDoctorModal(false);
        setDoctorForm({
          name: '',
          registrationNumber: '',
          specialization: 'General Medicine',
          email: '',
          phone: '',
          qualification: 'MBBS, MD',
          experienceYears: 5,
          consultationFee: 400,
          photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          timeSlots: ['09:00 AM - 01:00 PM', '04:00 PM - 07:00 PM']
        });
        setSuccessMessage(`Doctor account for ${res.doctor.name} created successfully.`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create doctor account.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Doctor Handler
  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to remove ${doctorName} from this hospital?`)) return;
    try {
      setIsActionLoading(true);
      await deleteHospitalDoctorApi(doctorId);
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
      setMetrics((prev) => ({ ...prev, doctorsCount: Math.max(0, (prev.doctorsCount || 0) - 1) }));
      setSuccessMessage(`Dr. ${doctorName} has been removed.`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove doctor.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Document Upload Handler
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    try {
      setIsActionLoading(true);
      setErrorMessage('');
      const res = await uploadHospitalDocumentApi(docForm);
      if (res && res.document) {
        setDocuments((prev) => [res.document, ...prev.filter((d) => d.id !== res.document.id)]);
        setMetrics((prev) => ({ ...prev, documentsCount: (prev.documentsCount || 0) + 1 }));
        setShowAddDocModal(false);
        setDocForm({
          title: '',
          category: 'Services',
          version: '1.0',
          summary: '',
          extractedText: ''
        });
        setSuccessMessage(`Document "${res.document.title}" published with live RAG indexing!`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish document.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Document Handler
  const handleDeleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to remove document "${docTitle}"?`)) return;
    try {
      setIsActionLoading(true);
      await deleteHospitalDocumentApi(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setMetrics((prev) => ({ ...prev, documentsCount: Math.max(0, (prev.documentsCount || 0) - 1) }));
      setSuccessMessage(`Document removed successfully.`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove document.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyDoctorCredentials = () => {
    if (!newDoctorCreds) return;
    const text = `MedConnect Doctor Portal Credentials\nDoctor: ${newDoctorCreds.name}\nLogin URL: ${newDoctorCreds.loginUrl}\nEmail: ${newDoctorCreds.email}\nTemporary Password: ${newDoctorCreds.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
  };

  const hospitalName = hospitalData?.name || currentUser?.hospitalName || currentUser?.name || 'Hospital Administration';
  const hospitalEmail = hospitalData?.email || currentUser?.email || 'admin@hospital.org';
  const hospitalPhone = hospitalData?.phone || '+91 824 244 5858';
  const hospitalLocation = hospitalData?.location || 'Mangaluru, Coastal Karnataka';
  const hospitalDepartments = Array.isArray(hospitalData?.departments) ? hospitalData.departments : ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine'];
  const hospitalFacilities = Array.isArray(hospitalData?.facilities) ? hospitalData.facilities : ['NABH Accredited', 'Level-3 Trauma Unit', '24x7 Cath Lab', 'ABDM Digital Health'];

  const allSpecializations = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Gynecology & Obstetrics',
    'ENT Specialist',
    'Psychiatry',
    'Ophthalmology',
    'Gastroenterology',
    'Oncology'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!isAuthenticated || currentUser?.role !== 'hospital') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans px-2 sm:px-4">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Hospital Authority • ABDM Empanelled</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {hospitalName}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium">
              Hospital Admin Management Console • Doctors, Appointments, Patient Records & Live Document RAG
            </p>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Stethoscope },
              { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
              { id: 'patients', label: `Patients (${patients.length})`, icon: Users },
              { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
              { id: 'profile', label: 'Profile', icon: Building2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-md scale-100'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={hospitalLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-200 hover:bg-rose-500/20 hover:text-rose-100 transition-all cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4 text-rose-300" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Status Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-600 font-bold hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 font-bold hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Credential Reveal Modal */}
      {newDoctorCreds && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Doctor Account Provisioned</h3>
                <p className="text-xs text-slate-500 font-medium">Share these credentials with the doctor</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Doctor Name:</span>
                <p className="text-slate-900 font-bold text-sm">{newDoctorCreds.name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Login URL:</span>
                <p className="text-brand-600 font-bold break-all">{newDoctorCreds.loginUrl}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Doctor Email (Username):</span>
                <p className="text-slate-900 font-bold break-all">{newDoctorCreds.email}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Temporary Password:</span>
                <p className="text-emerald-700 font-extrabold text-base bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 inline-block">
                  {newDoctorCreds.temporaryPassword}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyDoctorCredentials}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {copiedCreds ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setNewDoctorCreds(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. TAB: DASHBOARD OVERVIEW                           */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Doctors</span>
                <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{doctors.length}</p>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span>Active OPD Consultants</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Hospital Appointments</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{appointments.length}</p>
              <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                <span>Booked & Completed OPD</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Treated Patients</span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{patients.length}</p>
              <p className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                <span>Unique Consulted Patients</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">RAG Documents</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-slate-900">{documents.length}</p>
              <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                <span>Indexed for AI Search</span>
              </p>
            </div>

          </div>

          {/* Quick Action Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hospital Administration Shortcuts</h3>
              <p className="text-xs text-slate-500">Quickly add medical staff or publish public hospital guides</p>
            </div>
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('doctors'); setShowAddDoctorModal(true); }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('documents'); setShowAddDocModal(true); }}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Doctors Preview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <span>Active Hospital Doctors</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('doctors')}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                View all ({doctors.length}) →
              </button>
            </div>

            {doctors.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No doctors added yet. Click "Add New Doctor" above.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80'}
                        alt={doc.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="truncate">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{doc.name}</h4>
                        <p className="text-xs text-emerald-700 font-bold">{doc.specialization}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{doc.qualification || 'MBBS'}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Fee: ₹{doc.consultation_fee || 400}</span>
                      <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md text-[10px]">
                        {doc.status || 'Active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. TAB: DOCTORS MANAGEMENT                           */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <span>Doctor Roster Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provision, manage, and assign clinical schedules for hospital doctors. Doctor accounts are created ONLY by the hospital.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddDoctorModal(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Doctor</span>
            </button>
          </div>

          {/* Doctors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={doc.photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
                      alt={doc.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">{doc.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          {doc.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-emerald-700">{doc.specialization}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{doc.qualification || 'MBBS'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">Reg: {doc.registration_number || 'KMC-10482'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.phone || '+91 94481 22334'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-semibold">Consultation Fee:</span>
                      <span className="font-extrabold text-slate-900">₹{doc.consultation_fee || 400}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                    className="text-rose-600 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                    title="Remove doctor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. TAB: APPOINTMENTS                                 */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Hospital Appointment Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live appointments booked across all doctors in {hospitalName}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Total {appointments.length} Appointments
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No appointments recorded yet</p>
              <p className="text-xs text-slate-400">When patients book OPD slots with your doctors, they appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">Token / ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Consultant Doctor</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors font-medium">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{appt.token_number || appt.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{appt.patient_name || 'Patient'}</p>
                        <p className="text-[11px] text-slate-400">{appt.patient_phone || appt.patient_email || 'No contact'}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        {appt.doctor_name || 'Dr. Assigned'}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{appt.appointment_date || appt.date}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{appt.time_slot || appt.slot || '10:00 AM'}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {appt.type || 'In-Person OPD'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          appt.status === 'confirmed' || appt.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {appt.status || 'Confirmed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. TAB: PATIENTS DIRECTORY                           */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Hospital Patients Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients who have consulted at {hospitalName}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
              {patients.length} Active Patients
            </span>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No patient records found yet</p>
              <p className="text-xs text-slate-400">Patients will appear here automatically when they consult with your doctors.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((pat) => (
                <div key={pat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900">{pat.name || pat.patient_name}</h4>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 font-bold">
                      ABDM ID: {pat.abha_id || `ABHA-${pat.id}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {pat.email || 'Email not provided'}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {pat.phone || '+91 98450 12345'}</p>
                    {pat.last_doctor && <p className="text-[11px] text-emerald-700 font-semibold pt-1">Consulted: {pat.last_doctor}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. TAB: DOCUMENTS & LIVE RAG INDEXING                */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Hospital Document & Knowledge Base Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload & manage official hospital PDFs (Services, OPD Schedules, Emergency SOPs, Tariff, Patient Guides). These are indexed in real-time for patient AI search with anti-hallucination citations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddDocModal(true)}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      v{doc.version || '1.0'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{doc.title}</h3>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5">{doc.category || 'General Guide'}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-1.5">{doc.summary}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Live RAG Indexed
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. TAB: HOSPITAL PROFILE                             */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Official Hospital Identity & ABDM Details</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified hospital credentials and administrative contact
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Hospital Name</label>
                <p className="text-sm font-bold text-slate-900 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {hospitalName}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Hospital ID</label>
                <p className="text-sm font-bold text-slate-900 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                  {hospitalData?.id || currentUser?.hospitalId || 'hosp-1'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Hospital Admin Login</label>
                <p className="text-sm font-bold text-slate-900 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 break-all">
                  {hospitalEmail}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Helpline Number</label>
                <p className="text-sm font-bold text-slate-900 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {hospitalPhone}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Full Address</label>
              <p className="text-sm font-bold text-slate-900 mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {hospitalLocation}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Departments</label>
              <div className="flex flex-wrap gap-2">
                {hospitalDepartments.map((dept, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Accreditations & Facilities</label>
              <div className="flex flex-wrap gap-2">
                {hospitalFacilities.map((fac, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Need to modify official hospital licensing? Contact Karavali Network admin.
              </span>

              <button
                type="button"
                onClick={hospitalLogout}
                className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD DOCTOR MODAL (11 Required Fields)                */}
      {/* ---------------------------------------------------- */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  <span>Provision New Doctor Account</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Enter doctor details. Credentials will be generated securely for the doctor to sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              {/* Row 1: Name & Registration No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">1. Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Naik"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">2. Medical Registration No. *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.registrationNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, registrationNumber: e.target.value })}
                    placeholder="e.g. KMC-10892"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Specialization & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">3. Specialization *</label>
                  <select
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    {allSpecializations.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">4. Professional Email *</label>
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="e.g. ramesh@hospital.org"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Mobile & Qualification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">5. Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    placeholder="e.g. +91 94481 22334"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">6. Qualification *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    placeholder="e.g. MBBS, MD (Cardiology)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Experience & Consultation Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">7. Experience (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">8. Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={doctorForm.consultationFee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: parseInt(e.target.value, 10) || 300 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Photo URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">9. Profile Photo URL</label>
                <input
                  type="url"
                  value={doctorForm.photoUrl}
                  onChange={(e) => setDoctorForm({ ...doctorForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Row 6: Available Days */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">10. Available OPD Days</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = doctorForm.availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? doctorForm.availableDays.filter((d) => d !== day)
                            : [...doctorForm.availableDays, day];
                          setDoctorForm({ ...doctorForm, availableDays: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 7: Time Slots */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">11. Time Slots (Comma Separated)</label>
                <input
                  type="text"
                  value={doctorForm.timeSlots.join(', ')}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      timeSlots: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="09:00 AM - 01:00 PM, 04:00 PM - 07:00 PM"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isActionLoading ? 'Creating Doctor...' : 'Provision Doctor Account →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* UPLOAD DOCUMENT MODAL                                */}
      {/* ---------------------------------------------------- */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span>Publish Hospital Document</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Publish guidelines, schedules, or tariffs with instant live RAG indexing for patients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. OPD Consultation Schedule & Specialty Roster"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Category</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Services">Services & Departments</option>
                    <option value="Schedules">OPD & Visiting Schedules</option>
                    <option value="Tariff">Pricing & Tariffs</option>
                    <option value="Emergency">Emergency & SOPs</option>
                    <option value="Guidelines">Patient Guidelines & Rights</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Version</label>
                  <input
                    type="text"
                    value={docForm.version}
                    onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Executive Summary</label>
                <textarea
                  rows={2}
                  value={docForm.summary}
                  onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
                  placeholder="Brief summary of what this document covers..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Extracted Text Content (For AI RAG Indexing) *</label>
                <textarea
                  rows={6}
                  required
                  value={docForm.extractedText}
                  onChange={(e) => setDocForm({ ...docForm, extractedText: e.target.value })}
                  placeholder="Paste the document text, guidelines, timings, prices, or doctor timings here. The AI will cite this text precisely during patient queries."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isActionLoading ? 'Publishing...' : 'Publish Document →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
