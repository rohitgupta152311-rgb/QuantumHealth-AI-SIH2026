import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Atom, Activity, Menu, X, Cpu, BarChart3, Award, Database, Sparkles } from 'lucide-react';
import { healthCheck } from '../../services/api';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState<'connected' | 'simulated' | 'checking'>('checking');
  const [backendInfo, setBackendInfo] = useState<string>('PennyLane default.qubit');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await healthCheck();
        if (!isMounted) return;
        setBackendStatus('connected');
        if (res.quantum_backend) setBackendInfo(res.quantum_backend);
      } catch {
        if (!isMounted) return;
        setBackendStatus('simulated');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/about', icon: Award, label: 'Overview' },
    { to: '/analyze', icon: Activity, label: 'Analyze' },
    { to: '/dashboard', icon: Sparkles, label: 'Results' },
    { to: '/quantum-lab', icon: Cpu, label: 'Quantum Lab' },
    { to: '/comparison', icon: BarChart3, label: 'Compare' },
    { to: '/datasets', icon: Database, label: 'Datasets' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-sm'
          : 'bg-slate-950/60 backdrop-blur-sm border-b border-slate-800/60'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              aria-label={isMobileSidebarOpen ? 'Close sidebar navigation' : 'Open sidebar navigation'}
              aria-expanded={isMobileSidebarOpen}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-teal-500/40 text-teal-400 shadow-sm">
              <Atom size={18} className="text-teal-400" />
            </div>
            <span className="text-slate-100 font-bold tracking-tight">
              Quantum<span className="text-teal-400 font-semibold">Health</span>{' '}
              <span className="text-xs text-slate-400 font-mono font-medium">AI</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
            SIH 2026 #26139
          </span>
        </div>

        {/* Desktop Nav - Only shown on Landing Page where sidebar is not available */}
        {location.pathname === '/' && (
          <nav className="hidden lg:flex items-center gap-1" aria-label="Top navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isActive
                      ? 'text-teal-300 bg-slate-900 border border-teal-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-mono text-slate-400 border border-slate-800">
            <div className="relative flex h-2 w-2">
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <span className="truncate max-w-[180px]">{backendInfo}</span>
          </div>

          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950"
          >
            <Activity size={14} />
            <span className="hidden sm:inline">New Analysis</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
