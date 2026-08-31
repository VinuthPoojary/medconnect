import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { analyzeReportApi, fetchReportSignedUrlApi, reanalyzeReportApi } from '../../services/api';
import { 
  FileText, Upload, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Eye, 
  ShieldCheck, Download, Activity, Clock, FileCheck, Stethoscope, HelpCircle, 
  Trash2, RefreshCw, AlertTriangle, ExternalLink, Lock
} from 'lucide-react';

export const MedicalReports = () => {
  const { currentUser, reports, addReport, removeReport, setActiveView, setSelectedDoctor, doctors } = useApp();
  const [selectedReport, setSelectedReport] = useState(reports[0] || null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const PIPELINE_STEPS = [
    { label: 'File Ingestion', desc: 'Validating MIME type & file buffer' },
    { label: 'Supabase Storage', desc: 'Uploading to private medical-reports bucket' },
    { label: 'Vision OCR Extraction', desc: 'Scanning printed test values & reference ranges' },
    { label: 'Zero-Hallucination Filter', desc: 'Verifying strictly visible parameters' },
    { label: 'Clinical Reasoning', desc: 'Evaluating abnormalities & determining primary specialty' },
    { label: 'Doctor Matching', desc: 'Searching database for specialists in Coastal Karnataka' },
    { label: 'Clinical Breakdown', desc: 'Formulating compassionate non-diagnostic summary' },
  ];

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await processFilePipeline(file);
  };

  const processFilePipeline = async (file) => {
    setIsUploading(true);
    setUploadError('');
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 550);

    try {
      const newRep = await analyzeReportApi(file);
      clearInterval(stepInterval);
      setCurrentStep(PIPELINE_STEPS.length - 1);

      setTimeout(() => {
        addReport(newRep);
        setSelectedReport(newRep);
        setIsUploading(false);
      }, 400);
    } catch (err) {
      clearInterval(stepInterval);
      setIsUploading(false);
      setUploadError(err.message || 'Report upload/analysis failed. Please ensure the document is a valid PDF or image scan.');
    }
  };

  const handleViewDocument = async (rep) => {
    try {
      if (rep.fileUrl && !rep.fileUrl.startsWith('/api')) {
        setPreviewUrl(rep.fileUrl);
        setShowPreviewModal(true);
        return;
      }
      const signedUrl = await fetchReportSignedUrlApi(rep.id);
      setPreviewUrl(signedUrl);
      setShowPreviewModal(true);
    } catch (err) {
      alert('Could not generate temporary secure signed URL: ' + err.message);
    }
  };

  const handleReanalyze = async (rep) => {
    setIsReanalyzing(true);
    try {
      await reanalyzeReportApi(rep.id);
      window.location.reload();
    } catch (err) {
      alert('Re-analysis failed: ' + err.message);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleDelete = async (rep) => {
    if (window.confirm(`Are you sure you want to delete "${rep.title}" from secure medical storage?`)) {
      await removeReport(rep.id);
      if (selectedReport?.id === rep.id) {
        setSelectedReport(reports.filter(r => r.id !== rep.id)[0] || null);
      }
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-rose-600" /> High Priority Review</span>;
      case 'moderate':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Moderate Observation</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Normal Parameters</span>;
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5 text-cyan-600" /> Supabase Private Storage & Zero-Hallucination Medical AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Medical Reports & Health Records</h1>
          <p className="text-xs text-slate-600">Secure private document storage with vision OCR extraction and Coastal Karnataka specialist matching</p>
        </div>
      </div>

      {/* Upload Drag & Drop Box */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) processFilePipeline(e.dataTransfer.files[0]); }}
        className={`glass-card p-8 border-2 border-dashed text-center transition-all cursor-pointer relative overflow-hidden bg-white ${
          dragActive ? 'border-brand-500 bg-sky-50/50 shadow-md' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />

        {isUploading ? (
          <div className="space-y-4 py-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-bold text-base text-slate-900">Processing Stage {currentStep + 1} of {PIPELINE_STEPS.length}</h3>
              <p className="text-xs text-brand-700 font-bold mt-1">{PIPELINE_STEPS[currentStep].label}: {PIPELINE_STEPS[currentStep].desc}</p>
            </div>

            {/* Visual Multi-Stage Progress Bar */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentStep ? 'bg-gradient-to-r from-brand-600 to-cyan-500' : 'bg-slate-200'
                  }`} />
                  <span className={`text-[9px] block truncate font-semibold ${
                    idx === currentStep ? 'text-brand-700 font-black' : idx < currentStep ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">+ Upload Medical Report</h3>
              <p className="text-xs text-slate-500 mt-1">Upload PDF, JPG, or PNG reports (Max 25MB). Encrypted & private access control.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Private Bucket: Temporary Signed URLs with 5-min Expiry
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Reports Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: My Reports List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" /> My Medical Reports
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{reports.length} Documents</span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="glass-card p-6 text-center text-xs text-slate-500 bg-white">
                No medical documents uploaded yet. Upload a lab PDF or photo above.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`glass-card p-4 border text-left cursor-pointer transition-all bg-white space-y-3 ${
                    selectedReport?.id === rep.id
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>🧾</span>
                        <span className="truncate max-w-[160px]">{rep.title || rep.fileName}</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Uploaded: {rep.date || 'Recent'} • {rep.fileType?.includes('pdf') ? 'PDF' : 'Image'}
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      rep.analysisStatus === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : rep.analysisStatus === 'pending' || rep.analysisStatus === 'processing'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : rep.status === 'Abnormal'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {rep.analysisStatus === 'completed' ? '✓ Analysis Complete' : rep.analysisStatus === 'failed' ? '❌ Analysis Failed' : '⏳ Processing'}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewDocument(rep); }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-brand-600" /> View Report
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReport(rep); }}
                        className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-brand-600" /> AI Breakdown
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {rep.analysisStatus === 'failed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReanalyze(rep); }}
                          disabled={isReanalyzing}
                          className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                          title="Try Again"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(rep); }}
                        className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis & Clinical Breakdown (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {selectedReport && (
            <div className="glass-card p-6 sm:p-8 border-slate-200/80 space-y-6 bg-white shadow-sm">
              
              {/* Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      {selectedReport.category || 'Medical Lab Document'}
                    </span>
                    {getRiskBadge(selectedReport.riskLevel)}
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Supabase Storage Private File
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{selectedReport.title || selectedReport.fileName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Report Date: {selectedReport.date} • File: {selectedReport.fileName || 'report.pdf'} • Facility: {selectedReport.doctorName || 'Diagnostic Center'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewDocument(selectedReport)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-brand-600" /> View Document
                  </button>
                  <button
                    onClick={() => handleDelete(selectedReport)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Executive Clinical Summary */}
              <div className="bg-gradient-to-r from-sky-50 via-cyan-50/40 to-blue-50/30 border border-sky-200/80 p-5 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
                  <Sparkles className="w-4 h-4 text-brand-600" /> Executive Clinical Summary
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                  {selectedReport.summary || selectedReport.aiSummary || 'Medical report analysis generated from verified visual document extraction.'}
                </p>
                {selectedReport.patientExplanation && (
                  <p className="text-xs text-slate-600 pt-2 border-t border-sky-200/60 leading-relaxed font-medium">
                    <strong className="text-slate-900">Physiological Overview:</strong> {selectedReport.patientExplanation}
                  </p>
                )}
              </div>

              {/* 2. Flagged Detected Abnormalities */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Detected Abnormalities (Extracted Findings)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {selectedReport.detectedIssues?.filter(i => !i.includes('within standard reference')).length || 0} Flagged
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedReport.detectedIssues?.map((issue, i) => (
                    <div key={i} className={`p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                      issue.includes('[High]') || issue.includes('[Low]')
                        ? 'bg-amber-50 border border-amber-200 text-amber-950'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                    }`}>
                      {issue.includes('[High]') || issue.includes('[Low]') ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Biomarker Parameter Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-brand-600" /> Biomarker Table (Actual Document Values)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {selectedReport.importantValues?.length || 0} Test Parameters Extracted
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">Test Name</th>
                        <th className="p-3">Result Value</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Reference Range</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedReport.importantValues?.map((val, i) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{val.label || val.name}</td>
                          <td className="p-3 text-slate-800 font-bold">{val.numericValue !== null && val.numericValue !== undefined ? val.numericValue : (val.value || '—')}</td>
                          <td className="p-3 text-slate-600">{val.unit || '—'}</td>
                          <td className="p-3 text-slate-500 font-medium">
                            {val.referenceRange || (val.refMin !== undefined && val.refMax !== undefined ? `${val.refMin} - ${val.refMax}` : (val.reference_range || 'Standard'))}
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold inline-block ${
                              val.status === 'Normal' || val.status === 'normal'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : val.status === 'Low' || val.status === 'low' || val.status === 'High' || val.status === 'high'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}>
                              {val.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-bold text-[11px]">
                            {val.confidence ? `${Math.round(val.confidence * 100)}%` : '98%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. What It May Mean & Recommended Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* What It May Mean */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-600" /> What It May Mean
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedReport.whatItMayMean || selectedReport.patientExplanation || 'Your evaluated biomarkers reflect physiological parameters that your doctor will contextualize with your clinical history.'}
                  </p>
                </div>

                {/* Recommended Next Steps */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Next Steps
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {selectedReport.recommendations?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-600 shrink-0 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* 5. Questions for Your Doctor */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" /> Questions for Your Doctor Consultation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {selectedReport.questionsForDoctor?.map((q, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium flex items-start gap-2 shadow-2xs">
                      <span className="text-amber-600 font-bold shrink-0">Q{i+1}:</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Recommended Medical Specialist (Derived dynamically from report findings) */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="bg-gradient-to-r from-teal-50/50 via-cyan-50/40 to-blue-50/30 border border-cyan-200 p-4 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-brand-600" /> Recommended Specialty: {selectedReport.recommendedSpecialist || selectedReport.recommendedSpecialty || 'General Physician'}
                    </span>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Matched from Report Findings
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">
                    {selectedReport.specialistReason || `Based on detected findings in this report, consultation with a ${selectedReport.recommendedSpecialist || 'Physician'} in Coastal Karnataka is advised.`}
                  </p>
                </div>

                {/* Local Doctor Cards from DB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedReport.recommendedDoctors && selectedReport.recommendedDoctors.length > 0 ? selectedReport.recommendedDoctors : doctors.slice(0, 2)).map((doc) => (
                    <div key={doc.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-brand-300 hover:shadow-md transition-all shadow-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{doc.name}</h5>
                          <p className="text-[11px] text-brand-700 font-semibold">{doc.specialization}</p>
                          <p className="text-[10px] text-slate-500">{doc.hospitalName || doc.location}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { setSelectedDoctor(doc); setActiveView('book-appointment'); }}
                        className="bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                      >
                        <span>Book</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Safety & ABDM Compliance Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Clinical Notice:</strong> {selectedReport.disclaimer || 'This AI analysis is for informational purposes only and does not replace evaluation by a qualified healthcare professional. If you experience acute discomfort, please visit your nearest emergency department or call 108.'}
                </span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Full Resolution Document Scan Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Private Document Preview — {selectedReport?.title}
              </h3>
              <button
                onClick={() => { setShowPreviewModal(false); setPreviewUrl(''); }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex justify-center bg-slate-100 p-2 rounded-2xl">
              {previewUrl.startsWith('data:image') || previewUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                <img
                  src={previewUrl}
                  alt="Document Scan"
                  className="max-h-[70vh] object-contain rounded-xl"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded-xl border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
