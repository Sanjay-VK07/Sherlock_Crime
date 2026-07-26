import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Shield, AlertTriangle, Eye, User, 
  MapPin, CheckSquare, FileText, Briefcase, Calendar 
} from 'lucide-react';

export default function SearchPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('firs');
  
  // Search parameters for FIRs
  const [district, setDistrict] = useState('');
  const [station, setStation] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [status, setStatus] = useState('');
  const [firQuery, setFirQuery] = useState('');
  const [firs, setFirs] = useState([]);
  const [firsLoading, setFirsLoading] = useState(false);

  // Search parameters for Offenders
  const [offenderQuery, setOffenderQuery] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [offenders, setOffenders] = useState([]);
  const [offendersLoading, setOffendersLoading] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  // Constants
  const districts = ['Bengaluru Urban', 'Mysuru', 'Dakshina Kannada', 'Hubli-Dharwad', 'Belagavi', 'Kalaburagi'];
  const crimeTypes = ['Theft', 'Robbery', 'Burglary', 'Chain Snatching', 'Cybercrime', 'Financial Fraud', 'Vehicle Theft', 'Drug Trafficking', 'Murder'];
  const statuses = ['Under Investigation', 'Charge Sheet Filed', 'Closed', 'Under Trial'];

  const searchFirs = async () => {
    setFirsLoading(true);
    try {
      const res = await axios.get('/api/records/firs', {
        params: {
          district,
          station,
          type: crimeType,
          status,
          query: firQuery
        }
      });
      setFirs(res.data);
      setFirsLoading(false);
    } catch (err) {
      console.error('Error searching FIRs:', err);
      setFirsLoading(false);
    }
  };

  const searchOffenders = async () => {
    setOffendersLoading(true);
    try {
      const res = await axios.get('/api/records/offenders', {
        params: {
          query: offenderQuery,
          risk: riskLevel
        }
      });
      setOffenders(res.data);
      setOffendersLoading(false);
    } catch (err) {
      console.error('Error searching offenders:', err);
      setOffendersLoading(false);
    }
  };

  const loadOffenderDossier = async (id) => {
    setDossierLoading(true);
    try {
      const res = await axios.get(`/api/records/offenders/${id}`);
      setSelectedOffender(res.data);
      setDossierLoading(false);
    } catch (err) {
      console.error('Error fetching offender dossier:', err);
      setDossierLoading(false);
    }
  };

  // Run initial query on tab activate
  useEffect(() => {
    if (activeTab === 'firs') {
      searchFirs();
    } else {
      searchOffenders();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Search Navigation Tabs */}
      <div className="border-b border-slate-800 flex space-x-1">
        <button
          onClick={() => setActiveTab('firs')}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'firs' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/[0.02]' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>FIR Database Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab('offenders')}
          className={`flex items-center space-x-2 px-6 py-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === 'offenders' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/[0.02]' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Offender Registries Dossiers</span>
        </button>
      </div>

      {/* Tab 1: FIR Database Ledger */}
      {activeTab === 'firs' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-900/10">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Crime Type</label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {crimeTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Query Keywords</label>
              <input
                type="text"
                value={firQuery}
                onChange={(e) => setFirQuery(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
                placeholder="FIR No, IO name..."
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={searchFirs}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-all flex items-center justify-center space-x-1.5"
              >
                <Search className="h-4 w-4" />
                <span>SEARCH LEDGER</span>
              </button>
            </div>
          </div>

          {/* Results list */}
          <div className="glass-panel p-6 rounded-xl border border-slate-800">
            {firsLoading ? (
              <p className="text-slate-400 text-xs">Fetching ledger rows...</p>
            ) : firs.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-6">No matching case index records discovered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3">FIR Number</th>
                      <th className="pb-3">Police Station</th>
                      <th className="pb-3">District</th>
                      <th className="pb-3">Crime Type</th>
                      <th className="pb-3">IPC Section</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {firs.map(f => (
                      <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 font-mono font-bold text-blue-400">{f.fir_number}</td>
                        <td className="py-3.5 text-slate-300">{f.police_station}</td>
                        <td className="py-3.5 text-slate-300">{f.district}</td>
                        <td className="py-3.5 font-medium text-slate-200">{f.crime_type}</td>
                        <td className="py-3.5 font-mono text-slate-400">{f.ipc_sections}</td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.status === 'Closed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : f.status === 'Under Investigation' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => navigate(`/workspace/${f.id}`)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold transition-all border border-slate-800 inline-flex ml-auto"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Workspace</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Offender Registries Dossiers */}
      {activeTab === 'offenders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left search & list panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-850 pb-2">
                Offender Search Filters
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Suspect Name / Keyword</label>
                  <input
                    type="text"
                    value={offenderQuery}
                    onChange={(e) => setOffenderQuery(e.target.value)}
                    className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
                    placeholder="Search name, M.O..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Category</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All categories</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="MEDIUM">MEDIUM RISK</option>
                    <option value="LOW">LOW RISK</option>
                  </select>
                </div>
                <button
                  onClick={searchOffenders}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <Search className="h-4 w-4" />
                  <span>FILTER INDEX</span>
                </button>
              </div>
            </div>

            {/* List panel */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3 max-h-[350px] overflow-y-auto">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-850 pb-2">
                Offender List
              </h4>
              {offendersLoading ? (
                <p className="text-slate-400 text-xs">Loading records...</p>
              ) : offenders.length === 0 ? (
                <p className="text-slate-500 text-xs">No records found.</p>
              ) : (
                <div className="space-y-2">
                  {offenders.map(o => (
                    <div
                      key={o.id}
                      onClick={() => loadOffenderDossier(o.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedOffender?.id === o.id
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                          : 'bg-slate-900/30 border-slate-850 hover:bg-slate-850/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{o.name}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.25 rounded ${
                          o.risk_level === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {o.risk_level}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{o.occupation} | {o.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Offender Dossier File details */}
          <div className="lg:col-span-2">
            {dossierLoading ? (
              <div className="glass-panel p-12 rounded-xl text-center border border-slate-800 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm">Opening dossier registry file...</p>
              </div>
            ) : selectedOffender ? (
              <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
                
                {/* Dossier Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Mugshot placeholder */}
                    <div className="h-16 w-16 bg-slate-900 border border-slate-850 rounded flex items-center justify-center text-red-400">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-100 text-lg">{selectedOffender.name}</h3>
                      <p className="text-xs text-slate-400">Parent/Spouse: {selectedOffender.parent_name} | Age: {selectedOffender.age}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-red-500/10 text-red-400 font-black text-xs rounded border border-red-500/20">
                      {selectedOffender.risk_level} RISK OFFENDER
                    </span>
                  </div>
                </div>

                {/* Dossier Body details grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Personal details */}
                  <div className="space-y-4 md:col-span-1 text-xs">
                    <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1">
                      Personal Dossier
                    </h5>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Registered Address</p>
                        <p className="text-slate-200 font-medium">{selectedOffender.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Occupation</p>
                        <p className="text-slate-200 font-medium">{selectedOffender.occupation}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Aadhaar (Masked)</p>
                        <p className="text-slate-200 font-mono font-medium">{selectedOffender.aadhaar_masked || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Signature Modus Operandi</p>
                        <p className="text-slate-300 leading-relaxed font-mono font-medium">{selectedOffender.modus_operandi || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Center Column: Factual Criminal Record metrics (REPLACES generic risk scores) */}
                  <div className="space-y-4 md:col-span-1">
                    <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1">
                      Factual Crime metrics
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2.5 bg-slate-900/50 border border-slate-850 rounded">
                        <span className="text-slate-400 font-medium">Total Linked FIRs</span>
                        <span className="font-mono font-bold text-slate-200">{selectedOffender.metrics.total_cases}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-900/50 border border-slate-850 rounded">
                        <span className="text-slate-400 font-medium">Charge Sheets Filed</span>
                        <span className="font-mono font-bold text-slate-200 text-purple-400">{selectedOffender.metrics.charge_sheets}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-900/50 border border-slate-850 rounded">
                        <span className="text-slate-400 font-medium">Court Convictions</span>
                        <span className="font-mono font-bold text-slate-200 text-emerald-400">{selectedOffender.metrics.convictions}</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-900/50 border border-slate-850 rounded">
                        <span className="text-slate-400 font-medium">Active Warrants</span>
                        <span className="font-mono font-bold text-slate-200 text-amber-400">{selectedOffender.metrics.active_warrants}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Associates List */}
                  <div className="space-y-4 md:col-span-1 text-xs">
                    <h5 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1">
                      Known Associates
                    </h5>
                    {selectedOffender.associates.length === 0 ? (
                      <p className="text-slate-500 text-xs">No known co-accused associates logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedOffender.associates.map(assoc => (
                          <div key={assoc.id} className="flex items-center space-x-2 p-2 bg-slate-900/30 border border-slate-850 rounded">
                            <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-semibold truncate">{assoc.name}</p>
                              <p className="text-[9px] text-slate-500 truncate">Age: {assoc.age} | {assoc.gender}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Case History Timeline list */}
                <div className="border-t border-slate-800 pt-6">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-4">
                    Chronological Case History Ledger
                  </h4>
                  <div className="space-y-3">
                    {selectedOffender.cases.map((c, index) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-lg">
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="font-bold text-slate-400 font-mono">{index + 1}.</span>
                          <div>
                            <p className="font-bold text-blue-400 font-mono">{c.fir_number}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{c.police_station} | Section {c.ipc_sections}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-bold border border-slate-850">
                            {c.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="glass-panel p-12 rounded-xl text-center border border-slate-800 text-slate-500 text-xs">
                <Shield className="h-10 w-10 mx-auto text-slate-700 mb-3" />
                <p>Select any offender name on the left list to load their factual criminal dossier file.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
