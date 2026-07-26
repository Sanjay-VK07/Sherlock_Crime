import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CommandPalette from './CommandPalette';
import { 
  Shield, LayoutDashboard, MessageSquare, Map, 
  Network, Search, LogOut, CheckSquare, BrainCircuit, User, Command
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Command Center', icon: LayoutDashboard },
    { to: '/copilot', label: 'AI Copilot', icon: BrainCircuit },
    { to: '/chat', label: 'AI Chat Q&A', icon: MessageSquare },
    { to: '/map', label: 'Crime Map', icon: Map },
    { to: '/evidence', label: 'Evidence Network', icon: Network },
    { to: '/records', label: 'Case Records', icon: Search }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a] text-slate-100 font-sans">
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />

      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-500 animate-pulse" />
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                KSP SHERLOCK
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AI Investigation Copilot
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name || 'Officer'}</p>
              <div className="flex items-center space-x-1">
                <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                  {user?.role || 'Staff'}
                </span>
                <span className="text-[10px] text-slate-500 truncate">{user?.badge_number}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>LOGOUT SESSION</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#111827]/70 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold capitalize">
              {location.pathname === '/' ? 'Command Center Dashboard' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Cmd+K Quick Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-slate-400 hover:text-slate-200 hover:border-blue-500/50 text-xs transition-all"
            >
              <Command className="h-3.5 w-3.5 text-blue-400" />
              <span>Search Ledger...</span>
              <kbd className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">⌘K</kbd>
            </button>

            <div className="text-xs text-slate-400 font-mono hidden md:block">
              SYSTEM TIME: <span className="text-blue-400">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-xs text-slate-400 hidden sm:inline">Database Connected</span>
          </div>
        </header>

        {/* Pages Container */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

