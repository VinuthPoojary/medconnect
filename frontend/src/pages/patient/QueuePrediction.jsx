import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchQueueStatusApi } from '../../services/api';
import { Clock, Activity, Users, CheckCircle2, Calendar, RefreshCw } from 'lucide-react';
import { BookingModal } from '../../components/ui/BookingModal';

export const QueuePrediction = () => {
  const activeStatuses = ['upcoming', 'booked', 'waiting', 'in_consultation'];
  const upcomingApt = appointments.find(a => activeStatuses.includes(a.status?.toLowerCase()));
  const [selectedDocId, setSelectedDocId] = useState(upcomingApt ? upcomingApt.doctorId : doctors[0]?.id);

  const activeApt = upcomingApt && upcomingApt.doctorId === selectedDocId ? upcomingApt : null;
  const doc = doctors.find(d => d.id === selectedDocId) || doctors[0];

  const [isLoading, setIsLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState(activeApt ? (activeApt.queueNumber || 1) : 1);
  const [patientsAhead, setPatientsAhead] = useState(queueNumber > 1 ? queueNumber - 1 : 0);
  const [waitTime, setWaitTime] = useState(patientsAhead * 10);
  const [estTimeStr, setEstTimeStr] = useState('');
  const [totalBookedInDb, setTotalBookedInDb] = useState(0);

  // Fetch real database queue status
  const loadQueueStatus = async (doctorId, doctorName) => {
    setIsLoading(true);
    try {
      const qStatus = await fetchQueueStatusApi(doctorId, doctorName);
      if (qStatus) {
        setTotalBookedInDb(qStatus.totalBookedInDb || 0);
        if (!activeApt) {
          const qNum = qStatus.queueNumber || 1;
          setQueueNumber(qNum);
          setPatientsAhead(qStatus.patientsAhead || Math.max(0, qNum - 1));
          setWaitTime(qStatus.waitTimeMinutes || Math.max(0, qNum - 1) * 10);
          setEstTimeStr(qStatus.estimatedConsultationTime || '');
        }
      }
    } catch (err) {
      console.warn('Queue fetch fallback:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (doc) {
      loadQueueStatus(doc.id, doc.name);
    }
  }, [selectedDocId, doc?.id]);

  // Synchronize when upcoming appointment changes
  useEffect(() => {
    if (activeApt) {
      const qNum = activeApt.queueNumber || 1;
      setQueueNumber(qNum);
      const ahead = Math.max(0, qNum - 1);
      setPatientsAhead(ahead);
      setWaitTime(ahead * 10);
      
      const now = new Date();
      const est = new Date(now.getTime() + ahead * 10 * 60000);
      setEstTimeStr(est.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [activeApt]);


  // Real-time countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setWaitTime(prev => (prev > 1 ? prev - 1 : 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> Real-Time OPD Queue Prediction
        </div>
        <h1 className="text-3xl font-black text-white">AI OPD Queue Tracker</h1>
        <p className="text-xs text-slate-300">Live consultation speed & database wait-time forecasting</p>
      </div>

      {/* Doctor Selection Bar */}
      <div className="glass-card p-4 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider block">Tracking Doctor OPD Room:</span>
          <span className="text-white font-extrabold text-sm">{doc.name} ({doc.hospitalName})</span>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          {isLoading && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
          <select
            value={selectedDocId}
            onChange={e => setSelectedDocId(e.target.value)}
            className="glass-input text-xs w-full bg-slate-950 text-cyan-300 font-semibold"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} - {d.hospitalName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Queue Dashboard Widget */}
      <div className="glass-card p-6 sm:p-8 border-cyan-500/30 glow-cyan space-y-8">
        
        {/* Doctor Header */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img src={doc.photo} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/30 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {doc.specialization}
                </span>
                {totalBookedInDb > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {totalBookedInDb} Booked in DB
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1">{doc.name}</h3>
              <p className="text-xs text-slate-400">{doc.hospitalName} • OPD Room #304</p>
            </div>
          </div>

          <button
            onClick={() => setBookingDoctor(doc)}
            className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shrink-0 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Book OPD Ticket</span>
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
          
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queue Token</span>
            <p className="text-3xl font-black text-cyan-400">#{queueNumber}</p>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {activeApt ? 'Your Ticket' : 'Next Available'}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patients Ahead</span>
            <p className="text-3xl font-black text-amber-400">{patientsAhead}</p>
            <p className="text-[10px] text-slate-400">In waiting room</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Wait Time</span>
            <p className="text-3xl font-black text-emerald-400">{waitTime} <span className="text-xs font-normal">mins</span></p>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Countdown
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turn Expected</span>
            <p className="text-xl font-black text-purple-300 mt-2">{estTimeStr || '10:45 AM'}</p>
            <p className="text-[10px] text-slate-400">Predicted Consultation</p>
          </div>

        </div>

        {/* Doctor Speed Metric */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="font-bold text-white">OPD Speed Index:</p>
              <p className="text-[11px] text-slate-400">Averaging <span className="text-cyan-300 font-bold">5.0 mins</span> per patient consultation today</p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
            Optimal Speed
          </span>
        </div>

        {/* Live Queue Progress Visual Tracker */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Live Queue Position Visualizer</h4>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((pos) => (
              <div
                key={pos}
                className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                  pos < queueNumber
                    ? 'bg-slate-950 text-slate-500 border-slate-800'
                    : pos === queueNumber
                    ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white border-cyan-300 shadow-lg shadow-brand-500/30 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <span className="block text-[10px] text-slate-400">Position</span>
                #{pos} {pos === queueNumber ? (activeApt ? '(YOU)' : '(TICKET)') : ''}
              </div>
            ))}
          </div>
        </div>

      </div>

      {bookingDoctor && (
        <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />
      )}

    </div>
  );
};
