import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  FileText, Clock, User, CheckSquare, MessageSquare, 
  Plus, Calendar, Sparkles, Send, ArrowLeft, ShieldAlert, FileCheck
} from 'lucide-react';

export default function WorkspacePage() {
  const { firId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('timeline');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New task input
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  
  // New note input
  const [newNoteText, setNewNoteText] = useState('');

  // AI assistant input
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function fetchWorkspaceData() {
    try {
      const res = await axios.get(`/api/workspace/${firId}`);
      // Fetch evidence items from case API directly to populate Mahazar registry
      const caseRes = await axios.get(`/api/records/firs/${firId}`);
      
      setData({
        ...res.data,
        evidence: caseRes.data.evidence
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching workspace details:', err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkspaceData();
  }, [firId]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      const res = await axios.post(`/api/workspace/${firId}/tasks`, {
        task_title: newTaskTitle,
        due_date: newTaskDue || null
      });
      setData({ ...data, tasks: res.data });
      setNewTaskTitle('');
      setNewTaskDue('');
    } catch (err) {
      console.error('Error adding case task:', err);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    try {
      const res = await axios.put(`/api/workspace/tasks/${taskId}`, { status: nextStatus });
      const updatedTasks = data.tasks.map(t => t.id === taskId ? res.data : t);
      setData({ ...data, tasks: updatedTasks });
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText) return;
    try {
      const res = await axios.post(`/api/workspace/${firId}/notes`, { note_text: newNoteText });
      setData({ ...data, notes: res.data });
      setNewNoteText('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const res = await axios.post(`/api/workspace/${firId}/ai-help`, { prompt: aiPrompt });
      setAiResponse(res.data.response);
      setAiLoading(false);
    } catch (err) {
      console.error('Error getting AI help:', err);
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-xl text-center border border-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading Case Workspace parameters...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-6 text-red-400">
        <p>Error loading workspace details. Verify case exists.</p>
      </div>
    );
  }

  const { caseDetails, timeline, tasks, notes, evidence } = data;

  const tabs = [
    { id: 'timeline', label: 'Case Timeline', icon: Clock },
    { id: 'mahazar', label: 'Mahazar Seizure', icon: FileCheck },
    { id: 'tasks', label: 'Task Tracker', icon: CheckSquare },
    { id: 'notes', label: 'Case Diary Log', icon: FileText },
    { id: 'ai-help', label: 'Sherlock AI Help', icon: Sparkles }
  ];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-xs font-mono font-bold text-blue-400">{caseDetails.fir_number}</span>
          <h3 className="text-xl font-bold text-slate-100 mt-0.5">
            {caseDetails.crime_type} — Investigation Workspace
          </h3>
        </div>
      </div>

      {/* Buff Cardboard Case file jacket style banner */}
      <div className="cardboard-folder p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden gap-4">
        <div className="space-y-1">
          <span className="stamp-badge stamp-red text-[9px] mb-2">active dossier</span>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Police Station Location</p>
          <p className="text-sm font-extrabold text-slate-200">{caseDetails.police_station} PS ({caseDetails.district})</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Investigating Officer</p>
          <p className="text-sm font-extrabold text-slate-200">{caseDetails.io_name} ({caseDetails.io_badge})</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Prosecution Status</p>
          <span className="stamp-badge stamp-blue text-[9px] mt-1">
            {caseDetails.status}
          </span>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-slate-800 flex space-x-1 overflow-x-auto scrollbar-none">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === t.id 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/[0.02]' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[400px]">
        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-8">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest">
                Case Proceedings Timeline
              </h4>
              <span className="stamp-badge stamp-blue text-[9px]">TIMELINE CERTIFIED</span>
            </div>
            <div className="relative pl-8 border-l-2 border-slate-800 space-y-8 py-2">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[41px] top-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    item.status === 'completed' 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10' 
                      : 'bg-slate-900 border-slate-850 text-slate-500'
                  }`}>
                    <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-bold text-slate-200">{item.title}</h5>
                      <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mahazar Seizure Memo Tab */}
        {activeTab === 'mahazar' && (
          <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest">
                Mahazar Seizure Memo Register (Sec 102 CrPC)
              </h4>
              <span className="stamp-badge stamp-amber text-[9px]">EXHIBIT INVENTORY</span>
            </div>

            <div className="space-y-4 typewriter-text text-xs text-slate-350 bg-[#0a0e1a]/60 p-5 rounded-lg border border-slate-850">
              <p>Case Reference: <span className="text-blue-400 font-bold">{caseDetails.fir_number}</span></p>
              <p>Seizing Officer: <span className="text-slate-200 font-semibold">{caseDetails.io_name} ({caseDetails.io_badge})</span></p>
              <p>Panch Witness: <span className="text-slate-200 font-semibold">1. Suresh Gowda (Resident), 2. Manju N. (Resident)</span></p>

              <div className="overflow-x-auto pt-4">
                <table className="w-full text-left border-t border-slate-800">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 text-[10px]">
                      <th className="py-2.5">Item ID</th>
                      <th className="py-2.5">Evidence Type</th>
                      <th className="py-2.5">Dossier Value</th>
                      <th className="py-2.5">Mahazar Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {evidence && evidence.map((ev, idx) => (
                      <tr key={ev.id} className="hover:bg-slate-900/10">
                        <td className="py-3 font-bold text-slate-400">EX-{idx + 1}</td>
                        <td className="py-3 font-medium text-slate-200">{ev.evidence_type}</td>
                        <td className="py-3 font-bold text-blue-300">{ev.value}</td>
                        <td className="py-3 text-slate-400">{ev.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl border border-slate-800 md:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-800 pb-3">
                Action Item Tracker Checklist
              </h4>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-slate-500 text-xs">No tasks listed for this workspace.</p>
                ) : (
                  tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id, t.status)}
                      className="flex items-center space-x-3 p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-850 rounded-lg cursor-pointer transition-all"
                    >
                      <div className={`h-5 w-5 border-2 rounded flex items-center justify-center shrink-0 transition-all ${
                        t.status === 'Completed'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-slate-700'
                      }`}>
                        {t.status === 'Completed' && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${t.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.task_title}
                        </p>
                        {t.due_date && (
                          <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {t.due_date}</span>
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        t.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.status === 'In Progress'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add task form */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 h-fit space-y-4">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-800 pb-3">
                Create Action Item
              </h4>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Task Title / Action
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-[#0a0e1a] border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Request CDR audit logs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="w-full bg-[#0a0e1a] border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>ADD ACTION TASK</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Notes log */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 md:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-800 pb-3">
                Case Diary Ledger
              </h4>
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-slate-500 text-xs">No logs recorded for this workspace.</p>
                ) : (
                  notes.map(n => (
                    <div key={n.id} className="p-4 bg-slate-900/30 border border-slate-850 rounded-lg space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <span className="text-xs font-bold text-blue-400">{n.author_name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-350 leading-relaxed font-mono">
                        {n.note_text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add note form */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 h-fit space-y-4">
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-800 pb-3">
                Write Diary Entry
              </h4>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full bg-[#0a0e1a] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 h-32 resize-none"
                    placeholder="Log detail, statement notes, or spot visit diaries..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>LOG DIARY ENTRY</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* AI Help Tab */}
        {activeTab === 'ai-help' && (
          <div className="glass-panel p-6 rounded-xl border border-slate-800 space-y-6">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-widest border-b border-slate-800 pb-3 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
              <span>Sherlock Case Consultation Workspace AI</span>
            </h4>

            {/* Prompt input Form */}
            <form onSubmit={handleAskAi} className="flex space-x-3 bg-[#0a0e1a] border border-slate-800 rounded-lg p-2 max-w-3xl">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none px-2"
                placeholder="Ask AI for investigative next steps (e.g. 'check CCTV discrepancy' or 'recommend associates lookup')"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded transition-all"
              >
                {aiLoading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="h-4 w-4" />}
              </button>
            </form>

            {/* Consultation Output Card */}
            {aiResponse && (
              <div className="p-5 bg-blue-950/10 border border-blue-900/30 rounded-lg max-w-3xl space-y-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Copilot Consultation response</span>
                </p>
                <div className="text-xs text-slate-350 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiResponse}
                </div>
              </div>
            )}
            
            {/* Context Notice */}
            <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-lg flex items-start space-x-3 max-w-3xl">
              <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Consultation engine is context-aware. It processes case logs, pending timeline elements, and co-accused registries to formulate leads. Use as supplementary investigative validation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
