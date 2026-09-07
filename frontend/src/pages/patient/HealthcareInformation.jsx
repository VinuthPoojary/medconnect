import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  fetchHospitalsApi,
  fetchPublicHospitalDocumentsApi,
  queryHospitalRagApi
} from '../../services/api';
import {
  joinHospitalRoom,
  leaveHospitalRoom,
  onHospitalDocumentUpdated
} from '../../services/socket';
import {
  Building2,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Download,
  Award,
  Layers,
  Phone
} from 'lucide-react';

export const HealthcareInformation = () => {
  const { hospitals: contextHospitals, setActiveView } = useApp();

  const [hospitalsList, setHospitalsList] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // RAG Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isRagSearching, setIsRagSearching] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [ragError, setRagError] = useState('');

  // Suggested Prompts
  const suggestedQuestions = [
    'What are the OPD consultation timings and specialty clinics?',
    'What is the 24x7 emergency and trauma care protocol?',
    'What are the inpatient admission procedures and bed tariffs?',
    'What are the hospital visitor policies and ICU timings?'
  ];

  // Load Hospitals List
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await fetchHospitalsApi();
        if (Array.isArray(data) && data.length > 0) {
          setHospitalsList(data);
          setSelectedHospitalId(data[0].id);
          setSelectedHospital(data[0]);
        } else if (Array.isArray(contextHospitals) && contextHospitals.length > 0) {
          setHospitalsList(contextHospitals);
          setSelectedHospitalId(contextHospitals[0].id);
          setSelectedHospital(contextHospitals[0]);
        }
      } catch (err) {
        if (Array.isArray(contextHospitals) && contextHospitals.length > 0) {
          setHospitalsList(contextHospitals);
          setSelectedHospitalId(contextHospitals[0].id);
          setSelectedHospital(contextHospitals[0]);
        }
      }
    };

    loadHospitals();
  }, [contextHospitals]);

  // Load Documents for Selected Hospital
  const loadDocuments = useCallback(async (hospId) => {
    if (!hospId) return;
    try {
      setIsLoadingDocs(true);
      const docs = await fetchPublicHospitalDocumentsApi(hospId);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (err) {
      console.warn('Could not load hospital documents:', err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Sync Selected Hospital & Socket Room
  useEffect(() => {
    if (!selectedHospitalId) return;

    const currentHosp = hospitalsList.find((h) => h.id === selectedHospitalId);
    setSelectedHospital(currentHosp || null);
    setRagResult(null);
    setRagError('');

    loadDocuments(selectedHospitalId);

    // Join Socket Room for Real-Time Updates
    joinHospitalRoom(selectedHospitalId);

    const cleanupListener = onHospitalDocumentUpdated((payload) => {
      if (payload && payload.hospitalId === selectedHospitalId) {
        loadDocuments(selectedHospitalId);
      }
    });

    return () => {
      leaveHospitalRoom(selectedHospitalId);
      if (typeof cleanupListener === 'function') {
        cleanupListener();
      }
    };
  }, [selectedHospitalId, hospitalsList, loadDocuments]);

  // Handle RAG Natural Language Search
  const handleRagSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !selectedHospitalId) return;

    try {
      setIsRagSearching(true);
      setRagError('');
      setRagResult(null);

      const res = await queryHospitalRagApi(selectedHospitalId, searchQuery.trim());
      if (res) {
        setRagResult(res);
      }
    } catch (err) {
      setRagError(err.message || 'Failed to search hospital documentation.');
    } finally {
      setIsRagSearching(false);
    }
  };

  const handleSuggestedClick = (question) => {
    setSearchQuery(question);
    queryHospitalRagApi(selectedHospitalId, question)
      .then((res) => {
        setRagResult(res);
        setRagError('');
      })
      .catch((err) => {
        setRagError(err.message || 'Failed to search documentation.');
      });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans px-2 sm:px-4">

      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI-Powered Healthcare Knowledge Base & RAG</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Hospital Healthcare Information & Document Portal
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/80 font-medium max-w-2xl">
            Access official hospital schedules, departmental services, emergency SOPs, tariffs, and ask natural-language questions grounded strictly in verified hospital documents.
          </p>
        </div>
      </div>

      {/* Hospital Selector Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-700 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
              Select Hospital / Medical Center
            </label>
            <h2 className="text-base font-black text-slate-900">
              {selectedHospital?.name || 'Select a Healthcare Facility'}
            </h2>
          </div>
        </div>

        <div className="w-full md:w-80">
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-xs"
          >
            {hospitalsList.map((hosp) => (
              <option key={hosp.id} value={hosp.id}>
                {hosp.name} ({hosp.city || hosp.district || 'Coastal'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hospital Identity & Quick Contact Badge */}
      {selectedHospital && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{selectedHospital.location || selectedHospital.address || 'Mangaluru'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Helpline: {selectedHospital.phone || '0824-2444555'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100/70 px-3 py-1 rounded-full text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NABH Accredited • ABDM Connected</span>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 1: AI RAG NATURAL LANGUAGE SEARCH                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <span>Ask Hospital AI Assistant</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Grounded strictly in verified documents for <strong className="text-slate-800">{selectedHospital?.name}</strong> with page citations.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
            Anti-Hallucination Safe
          </span>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleRagSearch} className="space-y-3">
          <div className="relative flex items-center group">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-brand-600 transition-colors absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Ask anything about ${selectedHospital?.name || 'hospital'} (e.g. OPD hours, ICU visiting, trauma SOP, pricing)...`}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl py-3.5 pl-12 pr-32 text-xs sm:text-sm font-semibold focus:outline-none focus:bg-white focus:border-brand-600 focus:ring-3 focus:ring-blue-100 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isRagSearching || !searchQuery.trim()}
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40"
            >
              {isRagSearching ? 'Searching...' : 'Ask AI →'}
            </button>
          </div>

          {/* Suggested Quick Questions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Suggested Inquiries:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestedClick(q)}
                  className="text-[11px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {ragError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{ragError}</span>
          </div>
        )}

        {/* RAG Answer Display */}
        {ragResult && (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-3xl p-6 border border-brand-200 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-600 text-white rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-brand-900 uppercase tracking-wider">
                  Verified Hospital AI Response
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                Scope: {ragResult.hospitalName}
              </span>
            </div>

            <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line bg-white/80 p-4 rounded-2xl border border-slate-200">
              {ragResult.answer}
            </div>

            {/* Citations & Source Document References */}
            {Array.isArray(ragResult.citations) && ragResult.citations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                  <span>Document Sources & Page References:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {ragResult.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-white border border-brand-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>{cite.documentTitle || 'Official Hospital Guide'}</span>
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md font-mono">
                        Page {cite.pageNumber || '1'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SECTION 2: OFFICIAL HOSPITAL DOCUMENTS DIRECTORY                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Available Hospital Documents & Guides</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Official publications, brochures, and SOPs published by {selectedHospital?.name}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            {documents.length} Published Documents
          </span>
        </div>

        {isLoadingDocs ? (
          <div className="text-center py-12 space-y-2">
            <Clock className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading documents for {selectedHospital?.name}...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No documents published yet</p>
            <p className="text-xs text-slate-400">The hospital administration has not uploaded public guides yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50/70 hover:bg-white rounded-3xl p-5 border border-slate-200 hover:border-brand-300 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      v{doc.version || '1.0'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{doc.title}</h4>
                    <p className="text-xs font-bold text-emerald-700 mt-1">{doc.category || 'Hospital Guide'}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">{doc.summary}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-medium">
                    Updated {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery(`Summarize key points of ${doc.title}`);
                      handleRagSearch();
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <span>Analyze with AI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
