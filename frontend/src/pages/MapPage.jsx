import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertCircle, Sparkles, Shield, ChevronRight, Video, Clock } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapPage() {
  const crimeTypes = [
    'Armed Robbery', 'Chain Snatching', 'House Breaking', 
    'Vehicle Theft', 'Financial Fraud', 'Cyber Crime', 
    'Narcotic Offense', 'Homicide'
  ];

  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState([]);

  
  // Custom unique addition: CCTV Path Sequence simulation
  const [showCctvSequence, setShowCctvSequence] = useState(false);
  const [cctvTrail, setCctvTrail] = useState([]);

  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedType, setSelectedType] = useState('');

  const mapCenter = [12.9716, 77.5946]; // Bengaluru
  const mapZoom = 7;

  useEffect(() => {
    async function fetchData() {
      try {
        const [distRes, riskRes] = await Promise.all([
          axios.get('/api/map/districts'),
          axios.get('/api/map/risk-intelligence')
        ]);
        
        setDistricts(distRes.data);
        setRiskData(riskRes.data);

        // Prepopulate CCTV sequence timeline mapping (flagship suspect auto path)
        setCctvTrail([
          { camera: 'CAM-KOR-04', time: '11:30 PM', spot: 'Koramangala 4th Block (Complainant walking)', status: 'Active' },
          { camera: 'CAM-KOR-12', time: '11:39 PM', spot: 'Koramangala 8th Block Intersection (Robbery occurrence)', status: 'Active' },
          { camera: 'CAM-JAY-21', time: '11:55 PM', spot: 'Jayanagar Outer Ring Road (Speeding auto detected)', status: 'Active' }
        ]);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching map records:', err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const createPulseIcon = (count) => {
    let size = 16;
    let color = 'bg-green-500';
    if (count > 1000) {
      size = 36;
      color = 'bg-red-500';
    } else if (count > 200) {
      size = 26;
      color = 'bg-amber-500';
    }

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
          <div class="absolute animate-ping h-full w-full rounded-full ${color} opacity-40"></div>
          <div class="relative rounded-full h-4/5 w-4/5 ${color} flex items-center justify-center border-2 border-[#0a0e1a] text-[9px] font-black text-white font-mono shadow-md">
            ${count}
          </div>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const filteredDistricts = districts.filter(d => {
    if (selectedType) {
      return d.top_crimes.some(c => c.crime_type === selectedType);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 flex justify-between items-center relative bg-slate-900/10">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Geospatial Intelligence Map</h3>
          <p className="text-xs text-slate-400">Pulsing pins represent crime volume per district. Replaces abstract heatmaps with actionable counts.</p>
        </div>
      </div>

      {/* Main Container Map & Risk Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Map Area with Filter overlays */}
        <div className="glass-panel rounded-xl border border-slate-800 lg:col-span-3 min-h-[500px] relative overflow-hidden flex flex-col justify-between">
          
          {/* Map wrapper */}
          <div className="flex-1 w-full relative z-0 h-[480px]">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-[#0a0e1a]">
                <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm">Rendering map tiles...</p>
              </div>
            ) : (
              <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full">
                <ChangeView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Plot District markers dynamically */}
                {filteredDistricts.map(d => (
                  <Marker
                    key={d.district}
                    position={[d.lat, d.lng]}
                    icon={createPulseIcon(d.total_cases)}
                  >
                    <Popup className="custom-popup">
                      <div className="p-3 bg-[#0a0e1a] text-slate-200 rounded border border-slate-800 text-xs space-y-2 w-48 font-sans">
                        <p className="font-extrabold text-sm border-b border-slate-850 pb-1.5 text-slate-100">{d.district}</p>
                        <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                          Total Cases: <span className="font-mono text-white font-bold text-xs">{d.total_cases}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Active Station: <span className="text-white font-medium">{d.top_station}</span></p>
                        
                        <div className="pt-1.5 border-t border-slate-850">
                          <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mb-1">Top Crimes</p>
                          <div className="space-y-1">
                            {d.top_crimes.map(c => (
                              <div key={c.crime_type} className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-300 font-medium">{c.crime_type}</span>
                                <span className="font-mono text-slate-400 font-semibold">{c.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Left panel overlay filters */}
          <div className="absolute top-4 left-4 z-[999] glass-panel p-4 rounded-lg border border-slate-800/80 w-52 space-y-3 bg-[#0a0e1a]/85 shadow-lg">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">
              Filters Overlay
            </h5>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Audit Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-1 px-2 text-[11px] text-slate-350 focus:outline-none focus:border-blue-500"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Crime Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-slate-850 rounded py-1 px-2 text-[11px] text-slate-350 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {crimeTypes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Custom CCTV Sequence and Risk list switcher */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-850 rounded-lg">
              <button 
                onClick={() => setShowCctvSequence(false)}
                className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  !showCctvSequence ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Historical patterns
              </button>
              <button 
                onClick={() => setShowCctvSequence(true)}
                className={`py-1 rounded text-[10px] font-bold uppercase transition-all ${
                  showCctvSequence ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                CCTV Timeline
              </button>
            </div>

            {!showCctvSequence ? (
              // Historical pattern warnings
              <div className="space-y-4">
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider text-xs flex items-center space-x-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Crime Risk Intelligence</span>
                </h4>
                {riskData.map(risk => (
                  <div key={risk.id} className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg space-y-2">
                    <p className="font-bold text-slate-200 text-[10px]">{risk.event}</p>
                    <p className="text-[10px] text-slate-400 leading-normal">{risk.description}</p>
                    <div className="text-[10px] text-amber-400 font-mono pt-1">
                      Action: {risk.recommendation.substring(0, 45)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // CCTV vehicle trail sequence (flagship unique addition)
              <div className="space-y-4">
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-2 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <Video className="h-4 w-4 text-cyan-400" />
                  <span>CCTV Sequence: KA-01-AB-1234</span>
                </h4>
                <div className="relative pl-6 border-l border-slate-800 space-y-5 py-1">
                  {cctvTrail.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[29px] top-0.5 h-4 w-4 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center">
                        <Clock className="h-2 w-2 text-cyan-400" />
                      </div>
                      <div className="text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-cyan-400 font-mono text-[10px]">{item.camera}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-1 leading-normal font-mono">{item.spot}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-850 rounded-lg text-[9px] text-slate-500 leading-normal font-mono">
            *CCTV coordinates mapping matches camera timestamps to tower location pings to isolate paths.
          </div>
        </div>

      </div>
    </div>
  );
}
