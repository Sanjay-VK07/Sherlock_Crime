import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MessageSquare, Mic, MicOff, Send, HelpCircle, 
  Sparkles, Printer, FileText, AlertCircle, RefreshCw, AudioLines
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' or 'kn'
  const [chatLoading, setChatLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedExplainability, setSelectedExplainability] = useState(null);

  // Split view state
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' or 'transcribe'
  
  // Waveform bars simulation
  const [waveform, setWaveform] = useState([10, 20, 15, 30, 25, 40, 10, 15, 20, 10]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Mock historical query list
  const historyList = [
    { query: 'Robbery cases in Bengaluru Urban', lang: 'en' },
    { query: 'ಕೋರಮಂಗಲದಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು', lang: 'kn' },
    { query: 'List repeat offenders', lang: 'en' }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'kn' ? 'kn-IN' : 'en-IN';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setRecording(false);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setRecording(false);
      };

      rec.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = rec;
    }

    // Waveform randomizing for wave animation
    const waveInterval = setInterval(() => {
      if (recording) {
        setWaveform(Array.from({ length: 15 }, () => Math.floor(Math.random() * 50) + 10));
      }
    }, 150);

    // Default welcome prompt
    setMessages([
      {
        sender: 'ai',
        text: 'Hello, I am the Sherlock Crime Intelligence Assistant. Ask me queries about district-wise counts, repeat offenders, or specific police station statistics in English or Kannada.',
        explainability: {
          confidence: 100,
          reasoning: 'System initialization welcome prompt.',
          relatedFirs: []
        }
      }
    ]);

    return () => clearInterval(waveInterval);
  }, [recording]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
    }
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const latestAi = [...messages].reverse().find(m => m.sender === 'ai');
    if (latestAi) {
      setSelectedExplainability(latestAi.explainability);
    }
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setChatLoading(true);

    try {
      const res = await axios.post('/api/chat/query', {
        message: query,
        language
      });

      const aiMsg = {
        sender: 'ai',
        text: res.data.response,
        chartData: res.data.chartData,
        tableData: res.data.tableData,
        explainability: res.data.explainability
      };

      setMessages(prev => [...prev, aiMsg]);
      setChatLoading(false);
    } catch (err) {
      console.error('Error querying chat AI:', err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: 'Failed to communicate with the NLP engine. Please check connection.',
        explainability: { confidence: 0, reasoning: 'API request error.', relatedFirs: [] }
      }]);
      setChatLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleExportHistory = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KSP SHERLOCK — CONVERSATION REPORT LOG', 15, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 15, 27);
    doc.line(15, 30, 195, 30);

    let yOffset = 38;
    messages.forEach((msg) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.text(msg.sender === 'user' ? 'USER:' : 'SHERLOCK AI:', 15, yOffset);
      doc.setFont('Helvetica', 'normal');
      doc.text(msg.text, 45, yOffset, { maxWidth: 140 });
      yOffset += 15;
    });

    doc.save('Sherlock_Chat_History.pdf');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] gap-6 overflow-hidden">
      
      {/* 1. History Sidebar (Left) */}
      <div className="w-60 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-4">
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-blue-400" />
            <span>Search History</span>
          </h4>
          
          {/* View Toggles */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-850 rounded-lg">
            <button 
              onClick={() => setActiveMode('chat')}
              className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                activeMode === 'chat' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Q&A Console
            </button>
            <button 
              onClick={() => setActiveMode('transcribe')}
              className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                activeMode === 'transcribe' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              Statement translation
            </button>
          </div>

          {activeMode === 'chat' && (
            <div className="space-y-2 pt-2">
              {historyList.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLanguage(h.lang);
                    handleSend(h.query);
                  }}
                  className="w-full p-2.5 bg-slate-900/40 hover:bg-slate-850 border border-slate-850 rounded-lg text-left text-[11px] text-slate-400 hover:text-slate-200 truncate transition-all font-mono"
                >
                  {h.query}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleExportHistory}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center space-x-1 border border-slate-700 uppercase tracking-widest"
        >
          <Printer className="h-4 w-4" />
          <span>Save History PDF</span>
        </button>
      </div>

      {/* 2. Main Window (Center) */}
      <div className="flex-1 glass-panel rounded-xl border border-slate-800 flex flex-col justify-between overflow-hidden">
        
        {/* Chat / Transcribe view conditional rendering */}
        {activeMode === 'chat' ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                <h4 className="font-bold text-slate-200 text-sm">Bilingual Q&A Console</h4>
              </div>

              <button
                onClick={() => setLanguage(l => l === 'en' ? 'kn' : 'en')}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-bold font-mono text-blue-400 tracking-wide hover:bg-slate-700 transition-all"
              >
                {language === 'en' ? 'ENGLISH (EN)' : 'ಕನ್ನಡ (KN)'}
              </button>
            </div>

            {/* Messaging Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs space-y-3 ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-br-none'
                      : 'bg-[#111827] border border-slate-800 text-slate-350 rounded-bl-none'
                  }`}>
                    {/* Text Response */}
                    <p className="leading-relaxed font-sans">{msg.text}</p>

                    {/* Inline Table Render */}
                    {msg.tableData && (
                      <div className="overflow-x-auto pt-2">
                        <table className="min-w-full text-[10px] text-left border border-slate-800 bg-[#0a0e1a]/40 font-mono">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                              {msg.tableData.headers.map((h, i) => <th key={i} className="p-2">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {msg.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-900/30">
                                {row.map((val, cIdx) => <td key={cIdx} className="p-2 text-slate-300">{val}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Inline Chart Render */}
                    {msg.chartData && (
                      <div className="h-40 w-full min-w-[280px] pt-4 font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={msg.chartData}>
                            <XAxis dataKey="label" stroke="#475569" fontSize={9} />
                            <YAxis stroke="#475569" fontSize={9} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155' }}
                              labelStyle={{ color: '#fff', fontSize: '10px' }}
                            />
                            <Bar dataKey="value" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Explainability path link */}
                    {msg.sender === 'ai' && msg.explainability && (
                      <div className="flex justify-end pt-2 border-t border-slate-850">
                        <button
                          onClick={() => setSelectedExplainability(msg.explainability)}
                          className="text-[9px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center space-x-1"
                        >
                          <span>inspect reasoning path</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#111827] border border-slate-800 rounded-2xl rounded-bl-none p-4 flex items-center space-x-2">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-900/30 border-t border-slate-850 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center space-x-3 bg-[#0a0e1a] border border-slate-800 rounded-lg p-2"
              >
                {/* Voice mic */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-lg transition-all ${
                    recording 
                      ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse' 
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Voice input (English/Kannada)"
                >
                  {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-slate-200 placeholder-slate-550 focus:outline-none px-2"
                  placeholder={language === 'en' ? 'Ask Sherlock about crime records...' : 'ದತ್ತಸಂಚಯದ ಬಗ್ಗೆ ಇಲ್ಲೇ ಪ್ರಶ್ನೆ ಕೇಳಿ...'}
                />

                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Bhashini Split-screen Statement Translation Console */
          <div className="flex-1 flex flex-col justify-between overflow-hidden p-6 space-y-6 bg-[#090e19]">
            <div>
              <span className="stamp-badge stamp-blue mb-2">Bhashini translation Engine</span>
              <h4 className="font-extrabold text-slate-100 mt-2 text-sm uppercase tracking-wider">Bilingual Statement Translation Console</h4>
              <p className="text-[10px] text-slate-400 mt-1">Record local Kannada statements to automatically generate structured English case file extracts.</p>
            </div>

            {/* Split Screen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[300px]">
              
              {/* Left Side: Kannada input & Waveform */}
              <div className="p-5 bg-slate-950 border border-slate-850 rounded-xl flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
                    Oral Statement (Kannada / regional)
                  </h5>
                  <p className="text-xs text-slate-200 mt-4 leading-relaxed font-semibold">
                    {recording ? 'Listening...' : 'ಬೆಂಗಳೂರು ಉತ್ತರದಲ್ಲಿ ಕಳೆದ ತಿಂಗಳು ಎಷ್ಟು ಕಳ್ಳತನ ಪ್ರಕರಣ ದಾಖಲಾಗಿದೆ? ಆರೋಪಿ ರಮೇಶ್ ಕುಮಾರ್ ಸಿಕ್ಕಿಬಿದ್ದಿದ್ದಾನಾ?'}
                  </p>
                </div>

                {/* Simulated Waveform Visual */}
                <div className="space-y-4">
                  <div className="h-12 flex items-center justify-center space-x-1 border border-slate-900 rounded-lg p-2 bg-[#040812]">
                    {waveform.map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-500 rounded-full transition-all duration-150"
                        style={{ height: `${recording ? h : 10}px` }}
                      ></div>
                    ))}
                  </div>

                  <button
                    onClick={handleVoiceInput}
                    className={`w-full py-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2 border ${
                      recording 
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' 
                        : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
                    }`}
                  >
                    {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span>{recording ? 'STOP RECORDING' : 'RECORD STATEMENT (KANNADA)'}</span>
                  </button>
                </div>
              </div>

              {/* Right Side: English Translation & Extracted Entities */}
              <div className="p-5 bg-slate-900/30 border border-slate-850 rounded-xl flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5">
                    AI Translation & Entity Extraction
                  </h5>
                  <div className="text-xs text-slate-300 mt-4 leading-relaxed font-mono">
                    "How many <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">Theft</span> cases were registered in Bengaluru North last month? Is the suspect <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Ramesh Kumar</span> arrested?"
                  </div>
                </div>

                {/* Extracted Metadata registry */}
                <div className="p-4 bg-[#0a0e1a]/60 border border-slate-850 rounded-lg space-y-2.5 text-[10px] font-mono">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 uppercase font-bold">Extracted Entity</span>
                    <span className="text-slate-500 uppercase font-bold">Category</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-semibold">Ramesh Kumar</span>
                    <span className="text-slate-400 font-medium">Suspect Profile</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-semibold">Theft</span>
                    <span className="text-slate-400 font-medium">Crime Type</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">Bengaluru North</span>
                    <span className="text-slate-400 font-medium">Jurisdiction</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 3. Explainability Panel (Right Sidebar) */}
      <div className="w-60 glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between shrink-0 hidden lg:flex">
        <div>
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
            <span>Explainability Trail</span>
          </h4>
          
          {selectedExplainability ? (
            <div className="mt-5 space-y-5 text-xs">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">AI Confidence Level</p>
                <div className="flex items-center space-x-2 mt-1 font-mono">
                  <div className="w-full bg-slate-900 border border-slate-850 rounded-full h-2">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${selectedExplainability.confidence}%` }}></div>
                  </div>
                  <span className="text-cyan-400 font-bold">{selectedExplainability.confidence}%</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Reasoning Path</p>
                <p className="text-slate-400 mt-1 leading-relaxed font-mono bg-[#0a0e1a] p-3 rounded border border-slate-850">
                  {selectedExplainability.reasoning}
                </p>
              </div>

              {selectedExplainability.relatedFirs && selectedExplainability.relatedFirs.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Evidence Trail Sources</p>
                  <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px]">
                    {selectedExplainability.relatedFirs.map(f => (
                      <span key={f} className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-blue-400">
                        {f.split('/')[3] || f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-500 text-xs">
              <HelpCircle className="h-8 w-8 mx-auto text-slate-700 mb-2 animate-bounce" />
              <p>Submit a query to inspect the detailed reasoning trail of Sherlock AI responses.</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-lg flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-455 leading-normal">
            Explainability trail lists confidence ratings and files indices proving compliance.
          </p>
        </div>
      </div>

    </div>
  );
}
