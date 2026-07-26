import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, FileText, User, MapPin, Sparkles, Command, 
  ArrowRight, Mic, ShieldAlert, X 
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ firs: [], offenders: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ firs: [], offenders: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ firs: [], offenders: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [firsRes, offendersRes] = await Promise.all([
          axios.get(`/api/records/firs?query=${encodeURIComponent(query)}`),
          axios.get(`/api/records/offenders?query=${encodeURIComponent(query)}`)
        ]);
        setResults({
          firs: (firsRes.data || []).slice(0, 4),
          offenders: (offendersRes.data || []).slice(0, 4)
        });
      } catch (err) {
        console.error('Error in command palette search:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Open Live AI Copilot Analysis', icon: Sparkles, path: '/copilot' },
    { label: 'Launch Voice Statement Console', icon: Mic, path: '/chat' },
    { label: 'View Dynamic Crime Hotspot Map', icon: MapPin, path: '/map' },
    { label: 'Open Evidence Corkboard Network', icon: ShieldAlert, path: '/evidence' },
    { label: 'Inspect Flagship Case FIR 2024/0456', icon: FileText, path: '/workspace/456' }
  ];

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 transition-all">
      <div className="w-full max-w-2xl bg-[#0b1329] border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800/80 bg-slate-900/60 py-3.5">
          <Command className="h-5 w-5 text-blue-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FIR number, suspect name, MO, location, or command..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-800 rounded text-slate-400">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              ESC to exit
            </span>
          )}
        </div>

        {/* Results / Navigation Body */}
        <div className="p-4 max-h-[420px] overflow-y-auto space-y-4 font-sans text-xs scrollbar-thin">
          
          {loading && (
            <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p>Searching KSP Intelligence Ledger...</p>
            </div>
          )}

          {/* Quick Actions if empty search */}
          {!query.trim() && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 font-mono">
                ⚡ Quick Intelligence Shortcuts
              </p>
              <div className="space-y-1">
                {quickActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(action.path)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-blue-600/10 hover:border-blue-500/40 border border-slate-800/60 text-slate-200 transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{action.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-400 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query.trim() && !loading && (
            <>
              {/* FIRs Found */}
              {results.firs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-2 mb-2 font-mono flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>Matching FIR Records ({results.firs.length})</span>
                  </p>
                  <div className="space-y-1">
                    {results.firs.map(fir => (
                      <button
                        key={fir.id}
                        onClick={() => handleSelect(`/workspace/${fir.id}`)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-blue-600/10 hover:border-blue-500/40 border border-slate-800/60 text-left transition-all"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100 font-mono">{fir.fir_number}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono">
                              {fir.police_station}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">{fir.description}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {fir.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Offenders Found */}
              {results.offenders.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-2 mb-2 font-mono flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Matching Accused Dossiers ({results.offenders.length})</span>
                  </p>
                  <div className="space-y-1">
                    {results.offenders.map(offender => (
                      <button
                        key={offender.id}
                        onClick={() => handleSelect('/records')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/40 hover:bg-red-600/10 hover:border-red-500/40 border border-slate-800/60 text-left transition-all"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-100">{offender.name}</span>
                            <span className="text-[10px] text-slate-500">Age {offender.age}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md font-mono">
                            MO: {offender.modus_operandi}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-mono">
                          {offender.total_cases} CASES
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.firs.length === 0 && results.offenders.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <p className="font-medium">No intelligence records match "{query}"</p>
                  <p className="text-[11px] mt-1 text-slate-600">Try searching by FIR number, suspect name, or station location.</p>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>KSP Sherlock Global Intelligence Engine v2.0</span>
          <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-slate-300">↑↓</kbd> to navigate, <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-slate-300">↵</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
