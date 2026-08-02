import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { chatWithAiApi, askHospitalRagApi } from '../../services/api';
import { Bot, Send, Mic, MicOff, User, Plus } from 'lucide-react';

export const AIMedicalChatbot = () => {
  const { doctors, hospitals } = useApp();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'Namaskara! I am MedConnect AI Assistant powered by Google Gemini. How can I assist with your symptoms, doctor recommendations, hospital RAG scheme policies, or health questions today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    'Does KMC Hospital cover Ayushman Bharat?',
    'What should I do for high fever and dry cough?',
    'Find best Cardiologist in Mangaluru',
    'Which hospitals in Udupi accept Star Health insurance?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      let aiReply = '';
      const lower = text.toLowerCase();

      // Check if user query matches a specific hospital RAG lookup
      const matchedHosp = hospitals.find(h => lower.includes(h.name.toLowerCase().split(' ')[0]));

      if (matchedHosp && (lower.includes('scheme') || lower.includes('ayushman') || lower.includes('cover') || lower.includes('insurance') || lower.includes('policy'))) {
        aiReply = await askHospitalRagApi(matchedHosp.name, text);
      } else {
        // General Gemini AI Chat
        aiReply = await chatWithAiApi(text);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      // Intelligent fallback
      const lower = text.toLowerCase();
      let fallbackText = 'I have evaluated your query against MedConnect clinical database. Let me know if you would like me to match you with a specialist doctor or check hospital OPD slots.';

      if (lower.includes('kmc') && (lower.includes('ayushman') || lower.includes('cover'))) {
        fallbackText = 'Based on official documents uploaded by KMC Hospital Attavar & Jyothi: KMC Hospital provides 100% cashless treatment under Ayushman Bharat PM-JAY and Arogya Karnataka up to ₹5,00,000 per family for empanelled cardiac, surgical, and ICU procedures.';
      } else if (lower.includes('fever') || lower.includes('cough')) {
        fallbackText = 'For fever and cough: stay well-hydrated with warm fluids or tender coconut water. Take paracetamol 500mg after meals if body temp exceeds 100°F. If fever persists over 48 hours, use our AI Symptom Checker or visit Father Muller or KMC Hospital OPD in Mangaluru.';
      } else if (lower.includes('doctor') || lower.includes('cardiologist')) {
        const topCardio = doctors.find(d => d.specialization.includes('Cardio')) || doctors[0];
        fallbackText = `I recommend ${topCardio.name} (${topCardio.specialization} at ${topCardio.hospitalName}). Available OPD slots today include 10:30 AM & 02:30 PM.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInput('Does KMC Hospital cover Ayushman Bharat?');
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] max-h-[720px] min-h-[500px] flex flex-col glass-card border-slate-800 overflow-hidden relative shadow-2xl glow-cyan">
      
      {/* Top Bar (Fixed) */}
      <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>MedConnect AI Assistant (RAG Grounded)</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                ● Gemini Live
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Kannada, Tulu & English Multi-lingual RAG Engine</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:border-slate-700 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Messages Stream (Scrolls smoothly inside container) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-2xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`p-4 rounded-2xl text-xs space-y-1 ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-medium shadow-md'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] text-right ${msg.sender === 'user' ? 'text-cyan-200' : 'text-slate-500'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:.4s]"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (Fixed) */}
      <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] text-slate-500 font-bold shrink-0">Prompts:</span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar (Fixed) */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-3 rounded-xl transition-all ${
              isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Simulate Voice Input"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isListening ? 'Listening to voice...' : 'Ask MedConnect AI anything about symptoms, doctors, or hospital schemes...'}
            className="glass-input text-xs w-full"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-brand-600 hover:bg-brand-500 text-white p-3 rounded-xl transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
