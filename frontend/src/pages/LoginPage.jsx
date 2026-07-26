import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Key, Mail, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Preset password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handlePresetLogin = (presetEmail) => {
    setEmail(presetEmail);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { email: 'sho@ksp.gov.in', label: 'SHO Login (Inspector)', role: 'SHO' },
    { email: 'io@ksp.gov.in', label: 'IO Login (Sub-Inspector)', role: 'IO' },
    { email: 'sp@ksp.gov.in', label: 'SP Login (Supervisor)', role: 'SP' },
    { email: 'analyst@ksp.gov.in', label: 'Analyst Login', role: 'Analyst' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col justify-center items-center relative p-6">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-blue-600/10 border border-blue-500/20 mb-4 shadow-lg shadow-blue-500/5">
            <Shield className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            KSP SHERLOCK
          </h1>
          <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold">
            Karnataka State Police • Crime Intelligence Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl relative border border-slate-800">
          <h2 className="text-xl font-bold text-center mb-6">Crime Intelligence Sign In</h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/30 flex items-start space-x-3 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Official Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="name@ksp.gov.in"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0e1a] border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-sm transition-all duration-200 shadow-lg shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
            </button>
          </form>

          {/* Quick-Access Presets for Judges/Testing */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
              Quick-Access Demo Accounts (Password: password123)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.email}
                  onClick={() => handlePresetLogin(preset.email)}
                  className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                    email === preset.email 
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                      : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-800/30'
                  }`}
                >
                  <span className="text-[10px] font-bold tracking-tight">{preset.role} Access</span>
                  <span className="text-[9px] truncate w-full">{preset.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 mt-6 tracking-wide">
          Unauthorized access is strictly prohibited. Security audit logs are active.
        </p>
      </div>
    </div>
  );
}
