import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BrainCircuit, FileText, ChevronRight, AlertCircle, 
  MapPin, CheckSquare, Sparkles, Copy, Printer, FileCheck 
} from 'lucide-react';
import jsPDF from 'jspdf';

export default function CopilotPage() {
  const [firs, setFirs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch FIR list for dropdown selector
    async function fetchFirs() {
      try {
        const res = await axios.get('/api/records/firs');
        setFirs(res.data);
        // Default select our flagship case (456) if found
        const target = res.data.find(f => f.fir_number.includes('0456') || f.id === 456);
        if (target) {
          setSelectedId(target.id);
        } else if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching FIRs for Copilot:', err);
      }
    }
    fetchFirs();
  }, []);

  const handleAnalyze = async () => {
    if (!selectedId) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await axios.post(`/api/copilot/analyze/${selectedId}`);
      setAnalysis(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error during Copilot analysis:', err);
      setLoading(false);
    }
  };

  // Run initial analysis automatically on mount when selectedId changes (for flagship case 456)
  useEffect(() => {
    if (selectedId) {
      handleAnalyze();
    }
  }, [selectedId]);

  const handleCopyChargesheet = () => {
    if (!analysis?.chargesheetDraft) return;
    navigator.clipboard.writeText(analysis.chargesheetDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    if (!analysis) return;
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KSP SHERLOCK — CASE INVESTIGATION DRAFT REPORT', 15, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 15, 27);
    doc.line(15, 30, 195, 30);

    // Case Details
    doc.setFont('Helvetica', 'bold');
    doc.text('CASE DOSSIER DETAILS:', 15, 38);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Victim: ${analysis.summary.victim}`, 15, 45);
    doc.text(`Suspects: ${analysis.summary.accused}`, 15, 51);
    doc.text(`Incident Date: ${analysis.summary.date}`, 15, 57);
    doc.text(`Location: ${analysis.summary.location}`, 15, 63);

    // Leads
    doc.setFont('Helvetica', 'bold');
    doc.text('INVESTIGATION LEADS GENERATED:', 15, 75);
    doc.setFont('Helvetica', 'normal');
    let yOffset = 82;
    analysis.leads.forEach((l) => {
      doc.text(`• ${l.title}`, 17, yOffset);
      yOffset += 6;
      l.details.forEach((d) => {
        doc.text(`  - ${d}`, 20, yOffset);
        yOffset += 5;
      });
      yOffset += 2;
    });

    // Chargesheet
    doc.addPage();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MEMORANDUM OF DRAFT CHARGESHEET', 15, 20);
    doc.line(15, 24, 195, 24);
    doc.setFont('Courier', 'normal');
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(analysis.chargesheetDraft, 180);
    doc.text(splitText, 15, 32);

    doc.save(`KSP_Sherlock_Report_FIR_${selectedId}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Selector Box */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-500/20 text-blue-400">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Select Active FIR Docket for Copilot Review</h3>
            <p className="text-xs text-slate-400">AI will scan this file index against state records for hidden links</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[#0a0e1a] border border-slate-800 rounded-lg py-2 px-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            {firs.map(f => (
              <option key={f.id} value={f.id}>
                {f.fir_number} ({f.crime_type})
              </option>
            ))}
          </select>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? 'ANALYZING...' : 'RUN AUDIT'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass-panel p-12 rounded-xl text-center border border-slate-800 flex flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse">Running Sherlock intelligence matching scan across CCTNS files...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Top Panel: Dossier Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-xl border border-slate-800 md:col-span-1 flex flex-col justify-between">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider text-xs flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <span>Extracted Dossier</span>
              </h4>
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Victim</p>
                  <p className="text-slate-200 font-medium">{analysis.summary.victim}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Primary Suspects</p>
                  <p className="text-slate-200 font-medium">{analysis.summary.accused}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Incident Time</p>
                  <p className="text-slate-200 font-medium">{analysis.summary.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Crime Location</p>
                  <p className="text-slate-200 font-medium">{analysis.summary.location}</p>
                </div>
              </div>
            </div>

            {/* Narrative / Description card */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 md:col-span-3">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider text-xs">
                FIR Case Statement Narrative
              </h4>
              <p className="text-xs text-slate-300 mt-4 leading-relaxed bg-[#0a0e1a]/40 p-4 rounded-lg border border-slate-800 font-mono">
                {analysis.summary.narrative}
              </p>
            </div>
          </div>

          {/* Center Content: Leads & Timeline Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leads Column */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider text-xs flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span>AI-Generated Investigation Leads</span>
              </h4>
              <div className="space-y-4">
                {analysis.leads.map((lead, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/40 border border-slate-850 rounded-lg space-y-2">
                    <div className="flex items-start space-x-2">
                      <ChevronRight className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{lead.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{lead.description}</p>
                      </div>
                    </div>
                    <ul className="pl-6 text-[10px] text-blue-300 font-mono space-y-1">
                      {lead.details.map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Contradictions & Missing Evidence */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
              <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span>Dossier Inconsistencies & Evidence Gaps</span>
              </h4>

              {/* Contradictions list */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  ⚠️ Timelines & Contradictions Detected
                </p>
                {analysis.contradictions.map((c, i) => (
                  <div key={i} className="p-3 bg-amber-950/10 border border-amber-900/20 text-amber-300 text-xs rounded-lg">
                    {c}
                  </div>
                ))}
              </div>

              {/* Missing Checklist */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  ❌ Missing Crucial Evidence checklist
                </p>
                {analysis.missingEvidence.map((m, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-slate-300">
                    <div className="h-4 w-4 border border-red-500/40 rounded flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-red-400 font-bold">!</span>
                    </div>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Panel: Chargesheet Memo Draft */}
          <div className="glass-panel p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-indigo-400" />
                <span>AI-Drafted Chargesheet Memorandum (Sec 173 CrPC)</span>
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyChargesheet}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            <pre className="bg-[#0a0e1a] border border-slate-850 rounded-lg p-5 text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto h-64 whitespace-pre-wrap">
              {analysis.chargesheetDraft}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
