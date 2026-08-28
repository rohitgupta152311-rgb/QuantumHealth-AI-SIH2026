import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Atom, Activity, Sparkles, Menu, X, Cpu, CheckCircle2 } from 'lucide-react';
import { healthCheck } from '../../services/api';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState<'connected' | 'simulated' | 'checking'>('checking');
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
        setBackendStatus('simulated');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all">
              <Atom size={22} className="animate-spin-slow" />
            </div>
            <span className="text-gray-100">
              QuantumHealth <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 font-black">AI</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 ml-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/20 shadow-sm">
            <Sparkles size={12} className="text-yellow-400" />
            SIH 2026 #26139
          </div>
        </div>

        {/* Status & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 rounded-full bg-gray-900/90 px-3.5 py-1.5 text-xs font-medium text-gray-300 border border-gray-800 shadow-inner">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                backendStatus === 'connected' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}></span>
            </div>
            <span className="text-gray-400">Backend:</span>
            <span className="text-indigo-300 font-mono font-medium">{backendInfo}</span>
          </div>

          <Link
            to="/analyze"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all hover:scale-105 active:scale-95"
          >
            <Activity size={14} />
            <span className="hidden xs:inline">Run Prediction</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
