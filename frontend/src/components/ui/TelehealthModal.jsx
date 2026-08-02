import React, { useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Send, Sparkles } from 'lucide-react';

export const TelehealthModal = ({ appointment, onClose }) => {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [messages, setMessages] = useState([
    { sender: appointment?.doctorName || 'Doctor', text: `Hello ${appointment?.patientName || 'Patient'}, I am reviewing your health reports. How are you feeling today?`, time: '14:30' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'You', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { sender: appointment?.doctorName || 'Doctor', text: 'Understood. I recommend continuing the Omega-3 softgel and taking a light 20-minute daily walk.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Telehealth Video Consultation</span>
                <span className="bg-brand-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full border border-brand-500/30 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI Encrypted HD
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{appointment.doctorName} • {appointment.specialization}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 overflow-hidden">
          
          {/* Main Video View */}
          <div className="lg:col-span-2 bg-slate-950 relative flex flex-col items-center justify-center p-4 border-r border-slate-800">
            
            {/* Doctor Video Mock */}
            <div className="w-full h-full rounded-2xl overflow-hidden relative bg-slate-900 border border-slate-800 flex items-center justify-center">
              <img
                src={appointment.doctorPhoto}
                alt={appointment.doctorName}
                className="w-full h-full object-cover opacity-90"
              />

              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{appointment.doctorName}</span>
              </div>

              {/* Patient Self Cam Thumbnail */}
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-brand-500/50 bg-slate-950 shadow-xl">
                {videoOn ? (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-xs text-slate-300 font-bold">
                    [ Your Camera ]
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500">
                    <VideoOff className="w-6 h-6" />
                  </div>
                )}
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-xl transition-all ${micOn ? 'bg-slate-800 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-xl transition-all ${videoOn ? 'bg-slate-800 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl shadow-lg shadow-red-500/30 transition-all"
                title="End Consultation Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Consultation Live Chat */}
          <div className="bg-slate-900 flex flex-col justify-between p-4 h-full border-t lg:border-t-0 border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Consultation Notes & Chat
              </h4>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {messages.map((m, i) => (
                  <div key={i} className={`p-3 rounded-2xl text-xs ${m.sender === 'You' ? 'bg-brand-600/30 border border-brand-500/30 text-slate-100 ml-4' : 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'}`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-cyan-300">{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask doctor a question..."
                className="glass-input text-xs w-full"
              />
              <button type="submit" className="bg-brand-600 text-white p-2.5 rounded-xl hover:bg-brand-500 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
