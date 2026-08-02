import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Eye, ShieldCheck, Download, Activity, Clock } from 'lucide-react';

export const MedicalReports = () => {
  const { currentUser, reports, addReport, setActiveView, setSelectedDoctor, doctors } = useApp();
  const [selectedReport, setSelectedReport] = useState(reports[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    simulateNewReport(file.name);
  };

  const simulateNewReport = (filename) => {
    setIsUploading(true);
    setTimeout(() => {
      const newRep = {
        id: `rep-${Date.now()}`,
        title: filename ? filename.replace('.pdf', '') : 'Thyroid & Complete Blood Count',
        patientName: currentUser?.name || 'Patient',
        date: new Date().toISOString().split('T')[0],
        category: 'Blood Test',
        status: 'analyzed',
        summary: 'Thyroid Stimulating Hormone (TSH) level is 2.4 mIU/L (Normal). Haemoglobin levels recorded at 13.8 g/dL.',
        detectedIssues: ['No critical abnormalities detected.'],
        importantValues: [
          { label: 'Hemoglobin (Hb)', value: '13.8 g/dL', status: 'Normal' },
          { label: 'TSH (Thyroid)', value: '2.4 mIU/L', status: 'Normal' },
          { label: 'Platelet Count', value: '240,000 /µL', status: 'Normal' },
        ],
        recommendations: [
          'Maintain balanced coastal seafood & green vegetable diet.',
          'Annual routine follow-up screening in 12 months.'
        ],
        recommendedSpecialist: 'General Physician',
        fileType: 'PDF Document',
        size: '1.9 MB',
      };

      addReport(newRep);
      setSelectedReport(newRep);
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Pathology & Radiology Analyzer
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Medical Reports</h1>
          <p className="text-xs text-slate-400">Upload lab PDFs or DICOM scans for instant AI clinical breakdown</p>
        </div>
      </div>

      {/* Upload Drag & Drop Box */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => { e.preventDefault(); setDragActive(false); simulateNewReport('Uploaded_Lab_Report.pdf'); }}
        className={`glass-card p-8 border-2 border-dashed text-center transition-all cursor-pointer relative overflow-hidden ${
          dragActive ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {isUploading ? (
          <div className="space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center mx-auto animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">Analyzing Report with MedConnect AI...</h3>
            <p className="text-xs text-cyan-400">Extracting biomarkers, clinical flags, and specialist suggestions</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Drag & drop your medical PDF / Image report</h3>
              <p className="text-xs text-slate-400 mt-1">Supports Blood Tests, Lipid Profiles, ECG, MRI, X-Rays (Max 25MB)</p>
            </div>
            <span className="inline-block bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md">
              Select File from Device
            </span>
          </div>
        )}
      </div>

      {/* Main Content Grid: Reports History & Selected AI Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Report List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Lab History ({reports.length})</h3>

          <div className="space-y-3">
            {reports.map(rep => (
              <div
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`glass-card p-4 border text-left cursor-pointer transition-all ${
                  selectedReport.id === rep.id
                    ? 'border-cyan-400 bg-slate-900/90 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white truncate max-w-[200px]">{rep.title}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    AI Analyzed
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
                  <span>{rep.category}</span> • <span>{rep.date}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Analysis Card (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {selectedReport && (
            <div className="glass-card p-6 sm:p-8 border-slate-800 space-y-6">
              
              {/* Header summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                    {selectedReport.category} Analysis
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-400">Date Uploaded: {selectedReport.date} • {selectedReport.size}</p>
                </div>

                <button
                  onClick={() => alert('Downloading original document...')}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Original
                </button>
              </div>

              {/* AI Summary Card */}
              <div className="bg-gradient-to-r from-brand-950/60 to-slate-900 border border-brand-500/30 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> AI Executive Summary
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Flagged Detected Issues */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Detected Health Observations</h4>
                <div className="space-y-2">
                  {selectedReport.detectedIssues?.map((issue, i) => (
                    <div key={i} className="bg-slate-950 border border-amber-500/30 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Values Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Biomarker Breakdown</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 font-semibold">Test Parameter</th>
                        <th className="p-3 font-semibold">Recorded Value</th>
                        <th className="p-3 font-semibold">AI Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {selectedReport.importantValues?.map((val, i) => (
                        <tr key={i} className="hover-slate-900/50">
                          <td className="p-3 font-bold text-white">{val.label}</td>
                          <td className="p-3 text-slate-300">{val.value}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              val.status === 'Normal'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {val.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Lifestyle Recommendations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Actionable Recommendations</h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedReport.recommendations?.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Specialist CTA */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400">Suggested Specialist Follow-up:</span>
                  <p className="text-xs font-bold text-cyan-300">{selectedReport.recommendedSpecialist}</p>
                </div>

                <button
                  onClick={() => { setSelectedDoctor(doctors[0]); setActiveView('doctor-details'); }}
                  className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Book Specialist Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
