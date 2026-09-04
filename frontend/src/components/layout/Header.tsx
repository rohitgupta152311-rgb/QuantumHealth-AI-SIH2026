import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Atom, Activity, Sparkles, Menu, X, Cpu, BarChart3, Brain } from 'lucide-react';
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
    const checkStatus = async () => {
      try {
        const res = await healthCheck();
        setBackendStatus('connected');
        if (res.quantum_backend) setBackendInfo(res.quantum_backend);
      } catch { setBackendStatus('simulated'); }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/analyze', icon: Activity, label: 'Analyze' },
    { to: '/quantum-lab', icon: Cpu, label: 'Quantum Lab' },
    { to: '/comparison', icon: BarChart3, label: 'Compare' },
    { to: '/explainability', icon: Brain, label: 'Explain' },
  ];

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'bg-[#030712]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight group">
            <motion.div
              whileHover={{ scale: 1.15, rotate: 360 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_0_25px_rgba(129,140,248,0.5)] group-hover:shadow-[0_0_40px_rgba(129,140,248,0.7)] transition-shadow"
            >
              <Atom size={22} className="animate-spin-slow" />
            </motion.div>
            <span className="text-white font-black">
              Quantum<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Health</span>
            </span>
          </Link>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="hidden sm:flex items-center gap-1.5 ml-2 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-indigo-300 border border-white/[0.08]"
          >
            <Sparkles size={11} className="text-amber-400" />
            SIH 2026
          </motion.div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  isActive ? 'text-white bg-white/[0.08]' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={14} />
                {link.label}
                {isActive && (
                  <motion.div layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-mono text-gray-400 border border-white/[0.06]">
            <div className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-indigo-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-indigo-400'
              }`} />
            </div>
            <span className="text-gray-500">{backendInfo}</span>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
            <Link to="/analyze"
              className="btn-glow flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(129,140,248,0.4)] hover:shadow-[0_0_35px_rgba(129,140,248,0.6)] transition-all"
            >
              <Activity size={14} />
              <span className="hidden sm:inline">Run Prediction</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};
