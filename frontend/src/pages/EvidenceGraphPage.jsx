import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cytoscape from 'cytoscape';
import { 
  Network, AlertTriangle, Eye, Sparkles, 
  MapPin, Phone, CreditCard, User, HelpCircle, ShieldAlert, Layers, RefreshCw
} from 'lucide-react';

export default function EvidenceGraphPage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [missingLinks, setMissingLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [showAlert, setShowAlert] = useState(true);
  
  // Graph engine state
  const [viewMode, setViewMode] = useState('corkboard'); // 'corkboard' | 'cytoscape'
  const [selectedFir, setSelectedFir] = useState('456');
  const [firsList, setFirsList] = useState([]);
  const [graphLoading, setGraphLoading] = useState(false);

  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    async function initData() {
      try {
        const [linksRes, firsRes] = await Promise.all([
          axios.get('/api/evidence/missing-links'),
          axios.get('/api/records/firs?limit=20')
        ]);
        setMissingLinks(linksRes.data);
        setLoadingLinks(false);
        setFirsList(firsRes.data || []);
      } catch (err) {
        console.error('Error initializing evidence graph data:', err);
        setLoadingLinks(false);
      }
    }
    initData();

    // Default select main accused Ramesh Kumar
    setSelectedNode({
      name: 'Ramesh Kumar',
      role: 'Accused (A1)',
      age: 34,
      details: 'Auto Driver | Masked Aadhaar: XXXX-XXXX-4532',
      address: '14th Cross, Jayanagar, Bengaluru',
      mo: 'Night-time house breaking, targets ground floor apartments',
      cases: ['FIR/BEN/KOR/2024/0456', 'FIR/BEN/JAY/2023/1200', 'FIR/MYS/RUR/2023/0890'],
      risk: 'HIGH'
    });
  }, []);

  // Initialize and load Cytoscape canvas when viewMode changes to 'cytoscape' or selectedFir changes
  useEffect(() => {
    if (viewMode !== 'cytoscape' || !containerRef.current) return;

    let isMounted = true;
    async function loadCytoscapeGraph() {
      setGraphLoading(true);
      try {
        const res = await axios.get(`/api/evidence/graph/${selectedFir}`);
        if (!isMounted) return;

        if (cyRef.current) {
          cyRef.current.destroy();
        }

        const cy = cytoscape({
          container: containerRef.current,
          elements: [
            ...(res.data.nodes || []),
            ...(res.data.edges || [])
          ],
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#1e293b',
                'border-color': '#3b82f6',
                'border-width': 2,
                'label': 'data(label)',
                'color': '#f8fafc',
                'font-size': '10px',
                'font-family': 'JetBrains Mono, monospace',
                'text-valign': 'bottom',
                'text-margin-y': 6,
                'width': 36,
                'height': 36
              }
            },
            {
              selector: 'node[type = "FIR"]',
              style: {
                'background-color': '#1d4ed8',
                'border-color': '#60a5fa',
                'border-width': 3,
                'shape': 'hexagon',
                'width': 44,
                'height': 44
              }
            },
            {
              selector: 'node[type = "Accused"]',
              style: {
                'background-color': '#991b1b',
                'border-color': '#f87171',
                'border-width': 3,
                'shape': 'ellipse'
              }
            },
            {
              selector: 'node[type = "Victim"]',
              style: {
                'background-color': '#0369a1',
                'border-color': '#38bdf8',
                'shape': 'rectangle'
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#ef4444',
                'target-arrow-color': '#ef4444',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': '8px',
                'color': '#fca5a5',
                'text-background-opacity': 0.8,
                'text-background-color': '#0f172a',
                'text-background-padding': '3px'
              }
            }
          ],
          layout: {
            name: 'concentric',
            fit: true,
            padding: 30,
            animate: true
          }
        });

        cy.on('tap', 'node', (evt) => {
          const nodeData = evt.target.data();
          setSelectedNode({
            name: nodeData.label ? nodeData.label.split('\n')[0] : nodeData.id,
            role: nodeData.type || 'Entity',
            age: nodeData.age || 'N/A',
            details: nodeData.description || nodeData.address || `ID: ${nodeData.id}`,
            address: nodeData.address || 'Karnataka',
            mo: nodeData.type === 'Accused' ? 'Suspect in active FIR' : 'Case Entity Node',
            cases: [`FIR #${selectedFir}`],
            risk: nodeData.type === 'Accused' ? 'HIGH' : 'LOW'
          });
        });

        cyRef.current = cy;
        setGraphLoading(false);
      } catch (err) {
        console.error('Error loading Cytoscape graph:', err);
        setGraphLoading(false);
      }
    }

    loadCytoscapeGraph();

    return () => {
      isMounted = false;
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [viewMode, selectedFir]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const offendersData = [
    {
      id: 'ramesh',
      name: 'Ramesh Kumar',
      role: 'Accused (A1)',
      age: 34,
      details: 'Auto Driver | Aadhaar: XXXX-XXXX-4532',
      address: '14th Cross, Jayanagar, Bengaluru',
      mo: 'Night-time house breaking, targets ground floor apartments',
      cases: ['FIR/BEN/KOR/2024/0456', 'FIR/BEN/JAY/2023/1200', 'FIR/MYS/RUR/2023/0890'],
      risk: 'HIGH'
    },
    {
      id: 'suresh',
      name: 'Suresh Patil',
      role: 'Accused (A2)',
      age: 28,
      details: 'Delivery Partner | Aadhaar: XXXX-XXXX-9912',
      address: 'Near Water Tank, Whitefield, Bengaluru',
      mo: 'Two-wheeler chain snatching, early mornings layouts',
      cases: ['FIR/BEN/KOR/2024/0456', 'FIR/BEN/WHI/2024/0234'],
      risk: 'MEDIUM'
    },
    {
      id: 'manjunath',
      name: 'Manjunath R',
      role: 'Co-Accused (A3)',
      age: 31,
      details: 'Mechanic | Aadhaar: XXXX-XXXX-7721',
      address: '4th Block, HSR Layout, Bengaluru',
      mo: 'Co-accused specialist, acts as look-out',
      cases: ['FIR/BEN/KOR/2024/0456', 'FIR/BEN/HSR/2022/1500'],
      risk: 'MEDIUM'
    },
    {
      id: 'lakshmi',
      name: 'Lakshmi Devi',
      role: 'Victim / Complainant',
      age: 42,
      details: 'Housewife | Phone: +91-9839210293',
      address: 'Koramangala 4th Block, Bengaluru',
      mo: 'Complainant in Armed Robbery',
      cases: ['FIR/BEN/KOR/2024/0456'],
      risk: 'LOW'
    },
    {
      id: 'bank',
      name: 'SBI A/c: XXXX4532',
      role: 'Financial Account Node',
      age: 'N/A',
      details: 'UPI handle: ramesh.k@oksbi',
      address: 'State Bank of India - Koramangala Branch',
      mo: 'Transactions matching case robbery timeframe',
      cases: ['FIR/BEN/KOR/2024/0456'],
      risk: 'FLAGGED'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Warning Alert for Missing Links */}
      {!loadingLinks && missingLinks.length > 0 && showAlert && (
        <div className="p-4 bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs rounded-xl flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">
                ⚡ AI Missing Link Detector Alerts (Cross-FIR Matches)
              </p>
              <div className="mt-1 space-y-1.5">
                {missingLinks.map((alert, idx) => (
                  <p key={idx} className="leading-relaxed">
                    • Same <span className="font-bold text-white font-mono">{alert.type} ({alert.value})</span> appears across <span className="font-bold text-white">{alert.fir_count} different police station cases</span>.
                    {alert.cases.map(c => ` [${c.fir_number} at ${c.police_station}]`).join(', ')}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowAlert(false)}
            className="text-[10px] text-amber-500 font-bold hover:text-amber-400 uppercase tracking-widest px-2 py-1 bg-slate-900 rounded border border-slate-800"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Graph Area with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Interactive Corkboard OR Cytoscape Physics Engine */}
        <div className="corkboard-bg p-6 rounded-xl border border-slate-800 lg:col-span-3 flex flex-col justify-between min-h-[500px]">
          <div className="bg-[#111827]/90 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center space-x-2">
                <Network className="h-4 w-4 text-blue-400" />
                <span>Evidence Relationship Graph Engine</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Toggle between hand-pinned Polaroid corkboard and real-time Cytoscape physics layout canvas.
              </p>
            </div>

            {/* View Mode Toggle Controls */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedFir}
                onChange={(e) => setSelectedFir(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="456">FIR 2024/0456 (Flagship)</option>
                {firsList.filter(f => f.id !== 456).map(f => (
                  <option key={f.id} value={f.id}>FIR {f.fir_number}</option>
                ))}
              </select>

              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setViewMode('corkboard')}
                  className={`px-3 py-1 rounded transition-all ${viewMode === 'corkboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Polaroid Board
                </button>
                <button
                  onClick={() => setViewMode('cytoscape')}
                  className={`px-3 py-1 rounded transition-all ${viewMode === 'cytoscape' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Physics Network
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Rendering Area */}
          <div className="relative flex-1 min-h-[380px] rounded-lg overflow-hidden flex items-center justify-center p-4 mt-4">
            
            {viewMode === 'corkboard' ? (
              /* SVG Corkboard Polaroid view */
              <svg className="w-full h-full min-h-[360px]" viewBox="0 0 800 400">
                <defs>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="3" dy="3" stdDeviation="3" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* Red String threads connections */}
                <line x1="400" y1="200" x2="180" y2="120" stroke="#b91c1c" strokeWidth="3" filter="url(#shadow)" />
                <line x1="400" y1="200" x2="180" y2="120" stroke="#ef4444" strokeWidth="1.5" />
                <text x="270" y="150" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="Courier" textAnchor="middle" transform="rotate(-20, 270, 150)">Co-Accused in FIR 2024/456</text>

                <line x1="400" y1="200" x2="620" y2="100" stroke="#b91c1c" strokeWidth="3" filter="url(#shadow)" />
                <line x1="400" y1="200" x2="620" y2="100" stroke="#ef4444" strokeWidth="1.5" />
                <text x="510" y="140" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="Courier" textAnchor="middle" transform="rotate(-25, 510, 140)">Same Address</text>

                <line x1="400" y1="200" x2="620" y2="200" stroke="#b91c1c" strokeWidth="3" filter="url(#shadow)" />
                <line x1="400" y1="200" x2="620" y2="200" stroke="#ef4444" strokeWidth="1.5" />
                <text x="510" y="195" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="Courier" textAnchor="middle">Shared Bank Account</text>

                <line x1="400" y1="200" x2="620" y2="300" stroke="#b91c1c" strokeWidth="3" filter="url(#shadow)" />
                <line x1="400" y1="200" x2="620" y2="300" stroke="#ef4444" strokeWidth="1.5" />
                <text x="510" y="260" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="Courier" textAnchor="middle" transform="rotate(25, 510, 260)">Victim in 2 cases</text>

                {/* Push Pins */}
                <circle cx="400" cy="200" r="6" fill="#b91c1c" filter="url(#shadow)" />
                <circle cx="400" cy="200" r="3" fill="#f87171" />
                <circle cx="180" cy="120" r="6" fill="#b91c1c" filter="url(#shadow)" />
                <circle cx="180" cy="120" r="3" fill="#f87171" />
                <circle cx="620" cy="100" r="6" fill="#b91c1c" filter="url(#shadow)" />
                <circle cx="620" cy="100" r="3" fill="#f87171" />
                <circle cx="620" cy="200" r="6" fill="#b91c1c" filter="url(#shadow)" />
                <circle cx="620" cy="200" r="3" fill="#f87171" />
                <circle cx="620" cy="300" r="6" fill="#b91c1c" filter="url(#shadow)" />
                <circle cx="620" cy="300" r="3" fill="#f87171" />

                {/* Polaroids */}
                <g transform="translate(340, 140)" cursor="pointer" onClick={() => handleNodeClick(offendersData[0])} filter="url(#shadow)">
                  <rect width="110" height="120" rx="4" fill="#faf6f0" stroke="#475569" strokeWidth="1" />
                  <rect x="10" y="10" width="90" height="80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="55" cy="45" r="16" fill="#64748b" />
                  <path d="M 55 35 A 8 8 0 0 1 61 41 L 61 45 L 49 45 L 49 41 A 8 8 0 0 1 55 35 Z M 41 55 A 14 14 0 0 1 69 55 Z" fill="#64748b" />
                  <text x="55" y="102" fill="#1e293b" fontSize="8" fontWeight="black" fontFamily="Courier" textAnchor="middle">Ramesh Kumar</text>
                  <text x="55" y="112" fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="Courier" textAnchor="middle">A1 - ROBBERY</text>
                </g>

                <g transform="translate(120, 60)" cursor="pointer" onClick={() => handleNodeClick(offendersData[1])} filter="url(#shadow)">
                  <rect width="110" height="120" rx="4" fill="#faf6f0" stroke="#475569" strokeWidth="1" />
                  <rect x="10" y="10" width="90" height="80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="55" cy="45" r="14" fill="#94a3b8" />
                  <text x="55" y="102" fill="#1e293b" fontSize="8" fontWeight="black" fontFamily="Courier" textAnchor="middle">Suresh Patil</text>
                  <text x="55" y="112" fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="Courier" textAnchor="middle">A2 - SNATCHING</text>
                </g>

                <g transform="translate(620, 40)" cursor="pointer" onClick={() => handleNodeClick(offendersData[2])} filter="url(#shadow)">
                  <rect width="110" height="120" rx="4" fill="#faf6f0" stroke="#475569" strokeWidth="1" />
                  <rect x="10" y="10" width="90" height="80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="55" cy="45" r="14" fill="#94a3b8" />
                  <text x="55" y="102" fill="#1e293b" fontSize="8" fontWeight="black" fontFamily="Courier" textAnchor="middle">Manjunath R</text>
                  <text x="55" y="112" fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="Courier" textAnchor="middle">A3 - LOOKOUT</text>
                </g>

                <g transform="translate(620, 175)" cursor="pointer" onClick={() => handleNodeClick(offendersData[4])} filter="url(#shadow)">
                  <rect width="110" height="70" rx="4" fill="#0369a1" stroke="#eab308" strokeWidth="1" />
                  <rect x="8" y="8" width="94" height="54" rx="2" fill="#0284c7" />
                  <text x="55" y="32" fill="#facc15" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Courier">SBI A/c: XXXX4532</text>
                  <text x="55" y="45" fill="#e0f2fe" fontSize="7" textAnchor="middle" fontFamily="Courier">ramesh.k@oksbi</text>
                </g>

                <g transform="translate(620, 260)" cursor="pointer" onClick={() => handleNodeClick(offendersData[3])} filter="url(#shadow)">
                  <rect width="110" height="120" rx="4" fill="#faf6f0" stroke="#475569" strokeWidth="1" />
                  <rect x="10" y="10" width="90" height="80" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="55" cy="45" r="14" fill="#93c5fd" />
                  <text x="55" y="102" fill="#1e293b" fontSize="8" fontWeight="black" fontFamily="Courier" textAnchor="middle">Lakshmi Devi</text>
                  <text x="55" y="112" fill="#3b82f6" fontSize="7" fontWeight="bold" fontFamily="Courier" textAnchor="middle">VICTIM</text>
                </g>
              </svg>
            ) : (
              /* Real Cytoscape Physics Graph Canvas */
              <div className="w-full h-full min-h-[380px] relative bg-slate-950/60 rounded-xl border border-slate-800">
                {graphLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center space-x-2">
                    <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
                    <span className="text-xs font-mono text-slate-300">Calculating graph force layout...</span>
                  </div>
                )}
                <div ref={containerRef} className="w-full h-full min-h-[380px]" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar Node Details Panel */}
        <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider text-xs">
              Dossier Node Details
            </h4>
            
            {selectedNode ? (
              <div className="mt-5 space-y-5 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">{selectedNode.name}</h5>
                    <p className="text-[10px] text-slate-400">{selectedNode.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Age</p>
                    <p className="text-slate-300 font-medium">{selectedNode.age}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Identity details</p>
                    <p className="text-slate-300 font-medium font-mono">{selectedNode.details}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Registered Address</p>
                    <p className="text-slate-300 font-medium">{selectedNode.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Signature modus operandi</p>
                    <p className="text-slate-300 font-medium leading-relaxed font-mono">{selectedNode.mo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Associated FIR records</p>
                    <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px]">
                      {selectedNode.cases.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-slate-900 border border-slate-850 rounded text-blue-400">
                          {c.includes('/') ? c.split('/')[3] || c : c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500 text-xs">
                <HelpCircle className="h-8 w-8 mx-auto text-slate-700 mb-2" />
                <p>Click any node in the relationship network to inspect its detailed CCTNS dossier file.</p>
              </div>
            )}
          </div>

          {selectedNode && selectedNode.risk && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Risk Status
                </span>
                <span className={`stamp-badge stamp-${selectedNode.risk === 'HIGH' ? 'red' : 'amber'} text-[9px]`}>
                  {selectedNode.risk} RISK
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
