import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FileText, Users, CheckCircle, AlertTriangle, 
  MapPin, Eye, ArrowRight, BarChart2, Bell, Radio
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CommandCenterPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [kpis, setKpis] = useState({
    total: 5120,
    pending: 1832,
    arrests: 347,
    chargesheets: 1840
  });

  const [urgentCases, setUrgentCases] = useState([]);
  const [recentFirs, setRecentFirs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live active radio dispatch ticker feeds
  const [dispatchFeeds, setDispatchFeeds] = useState([
    '14:20:11 - HSR Layout PS: Report of property theft filed.',
    '14:22:30 - Koramangala PS: AI flagged suspect vehicle KA-01-AB-1234 active near boundary.',
    '14:25:02 - Majestic PS: Beat constable reported suspicious loitering near railway station.',
    '14:28:44 - Jayanagar PS: Accused Ramesh Kumar spotted in auto-rickshaw KA-01-AB-1234.'
  ]);

  const [crimeStats, setCrimeStats] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [firsRes, districtsRes, analyticsRes] = await Promise.all([
          axios.get('/api/records/firs?limit=5'),
          axios.get('/api/map/districts'),
          axios.get('/api/records/analytics')
        ]);
        
        setRecentFirs(firsRes.data.slice(0, 5));
        setDistricts(districtsRes.data.slice(0, 5));

        if (analyticsRes.data) {
          const a = analyticsRes.data;
          setKpis({
            total: a.kpis.total_cases,
            pending: a.kpis.pending_investigations,
            arrests: a.kpis.total_arrests,
            chargesheets: a.kpis.chargesheets_filed
          });
          setCrimeStats((a.categories || []).map(c => ({ name: c.crime_type, count: c.count })));
        }

        // Procedural set urgent cases matching our flagship design specification
        setUrgentCases([
          {
            id: 456,
            fir_number: 'FIR/BEN/KOR/2024/0456',
            crime_type: 'Armed Robbery',
            reasons: [
              'Primary suspect Ramesh Kumar is a high-risk repeat offender with 4 convictions.',
              'Victim Lakshmi Devi is a senior citizen (72 yrs).',
              'Investigation has been pending for 45 days. No chargesheet filed.'
            ]
          },
          {
            id: 234,
            fir_number: 'FIR/BEN/WHI/2024/0234',
            crime_type: 'Financial Fraud',
            reasons: [
              'Linked to active cross-district organized syndicate.',
              'Total value involved is ₹2.3 Crores.',
              'Same UPI ID matches 4 other FIR files across districts.'
            ]
          }
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard records:', err);
        setLoading(false);
      }
    }
    fetchData();


    // Procedural add random new live dispatch tickers for realistic police radio simulation
    const interval = setInterval(() => {
      const psList = ['Koramangala', 'HSR Layout', 'Indiranagar', 'Jayanagar', 'Whitefield'];
      const alertList = [
        'AI flagged suspect vehicle active near boundary.',
        'Report of suspicious transaction matched in UPI database.',
        'Officer requesting case dossier retrieval via terminal.',
        'Panch Witness registered under Mahazar memo.'
      ];
      const timeStr = new Date().toTimeString().split(' ')[0];
      const newAlert = `${timeStr} - ${psList[Math.floor(Math.random() * psList.length)]} PS: ${alertList[Math.floor(Math.random() * alertList.length)]}`;
      
      setDispatchFeeds(prev => [newAlert, ...prev.slice(0, 3)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenWorkspace = (id) => {
    navigate(`/workspace/${id}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Cardboard style folder header */}
      <div className="cardboard-folder p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden border border-slate-800 gap-4">
        <div>
          <span className="stamp-badge stamp-blue mb-2">Authenticated Terminal</span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">Welcome Back, {user?.name}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Official Assignment: <span className="text-blue-400 font-bold">{user?.role}</span> | Badge ID: <span className="font-mono text-slate-300">{user?.badge_number}</span>
          </p>
        </div>
        
        {/* Holographic Radio Dispatch feed ticker */}
        <div className="w-full md:w-96 bg-[#040812] border border-emerald-950 p-3.5 rounded-lg">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-950/80 pb-1.5 mb-2">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span>KSP Radio Dispatch Ticker (Live)</span>
          </div>
          <div className="space-y-1.5 h-16 overflow-y-auto font-mono text-[9px] text-emerald-500 leading-relaxed scrollbar-thin">
            {dispatchFeeds.map((feed, idx) => (
              <div key={idx} className="truncate select-none">
                {idx === 0 ? <span className="animate-pulse">● </span> : '  '}{feed}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3.5 bg-blue-600/10 rounded-lg border border-blue-500/20 text-blue-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Cases (KSP)</p>
            <p className="text-2xl font-black mt-1 font-mono">{kpis.total}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3.5 bg-amber-600/10 rounded-lg border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Pending Cases</p>
            <p className="text-2xl font-black mt-1 font-mono text-amber-400">{kpis.pending}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3.5 bg-emerald-600/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Arrests Made</p>
            <p className="text-2xl font-black mt-1 font-mono text-emerald-400">{kpis.arrests}</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center space-x-4 border border-slate-800">
          <div className="p-3.5 bg-purple-600/10 rounded-lg border border-purple-500/20 text-purple-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Chargesheets Filed</p>
            <p className="text-2xl font-black mt-1 font-mono text-purple-400">{kpis.chargesheets}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Priority & Crime Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: AI Case Prioritization (SHO Morning view) */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
                  🚨 URGENT CASE PRIORITIZATION — Dispatch Queue
                </h4>
              </div>
              <span className="stamp-badge stamp-red text-[9px]">
                ACTION REQUIRED
              </span>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm">Loading urgent file indices...</p>
            ) : (
              <div className="space-y-4">
                {urgentCases.map(c => (
                  <div key={c.id} className="p-5 bg-red-950/5 border border-red-900/20 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-red-450 font-mono">{c.fir_number}</span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-bold uppercase tracking-wider">
                        {c.crime_type}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1.5 font-mono leading-relaxed">
                      {c.reasons.map((r, index) => (
                        <li key={index}>{r}</li>
                      ))}
                    </ul>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleOpenWorkspace(c.id)}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-red-950/40 hover:bg-red-900/40 text-red-300 rounded border border-red-900/40 text-xs font-semibold transition-all"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Analysis incorporates victim age profiles, co-accused priors, and case duration counts.
          </div>
        </div>

        {/* Right: Crime stats horizontal Bar Chart */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col">
          <h4 className="font-bold text-slate-200 mb-6 uppercase tracking-wider text-xs flex items-center space-x-2">
            <BarChart2 className="h-4 w-4 text-blue-400" />
            <span>Cases by Crime Category</span>
          </h4>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={crimeStats}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis type="number" stroke="#475569" fontSize={10} hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent FIR Register Table & Hotspot List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent FIRs Table with Typewriter styling */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 lg:col-span-2">
          <h4 className="font-bold text-slate-200 mb-6 uppercase tracking-wider text-xs">
            📄 Recent FIR Entries ledger
          </h4>
          {loading ? (
            <p className="text-slate-400 text-xs">Loading ledger rows...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs typewriter-text">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">FIR Number</th>
                    <th className="pb-3">PS Location</th>
                    <th className="pb-3">District</th>
                    <th className="pb-3">Crime Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {recentFirs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 font-bold text-blue-400">{f.fir_number}</td>
                      <td className="py-3 text-slate-350">{f.police_station}</td>
                      <td className="py-3 text-slate-350">{f.district}</td>
                      <td className="py-3 font-medium text-slate-200">{f.crime_type}</td>
                      <td className="py-3">
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
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleOpenWorkspace(f.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-450 hover:text-slate-200 transition-colors"
                          title="Open Case Workspace"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hotspots Quick List */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800">
          <h4 className="font-bold text-slate-200 mb-6 uppercase tracking-wider text-xs flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <span>High-Risk Districts Index</span>
          </h4>
          <div className="space-y-4">
            {districts.map((d, idx) => (
              <div key={d.district} className="flex justify-between items-center p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg font-mono">
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    {idx + 1}. {d.district}
                  </p>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    Active Station: <span className="text-slate-350">{d.top_station}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-red-950/20 text-red-400 text-[10px] font-bold rounded border border-red-900/30">
                    {d.total_cases} cases
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
