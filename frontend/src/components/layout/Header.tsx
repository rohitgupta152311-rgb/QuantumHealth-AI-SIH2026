import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Atom, Activity, Sparkles, Menu, X, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import { healthCheck } from '../../services/api';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [backendInfo, setBackendInfo] = useState<string>('PennyLane default.qubit');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await healthCheck();
        setBackendStatus('connected');
        if (res.quantum_backend) {
          setBackendInfo(res.quantum_backend);
        }
      } catch {
        setBackendStatus('offline');
        setBackendInfo('Offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white shadow-sm transition-all group-hover:bg-teal-500">
              <Activity size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-100 font-bold text-lg tracking-tight leading-none">
                QuantumHealth<span className="text-teal-400">.AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Clinical Decision Support
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 ml-4 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 border border-slate-800">
            <ShieldCheck size={13} className="text-teal-400" />
            <span>SIH 2026 #26139</span>
          </div>
        </div>

        {/* Status & Quick Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-800">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </div>
            <span className="text-slate-400">Backend:</span>
            <span className="text-teal-300 font-mono font-medium">{backendInfo}</span>
          </div>

          <Link
            to="/analyze"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <Activity size={14} />
            <span className="hidden xs:inline">New Diagnosis</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
