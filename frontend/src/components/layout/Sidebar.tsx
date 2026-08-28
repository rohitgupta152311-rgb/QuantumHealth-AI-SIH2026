import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, FlaskConical, LayoutDashboard, Shield, Sparkles, BookOpen, Layers, Cpu } from 'lucide-react';
import { clsx } from 'clsx';

const primaryNavItems = [
  { name: 'Disease Risk Analysis', path: '/analyze', icon: Activity, tag: 'Predict' },
  { name: 'Hybrid AI Dashboard', path: '/dashboard', icon: LayoutDashboard, tag: 'Results' },
  { name: 'Quantum Laboratory', path: '/quantum-lab', icon: FlaskConical, tag: 'VQC' },
  { name: 'Model Comparison', path: '/comparison', icon: BarChart3, tag: 'Benchmark' },
  { name: 'Model Explainability', path: '/explainability', icon: Shield, tag: 'SHAP/FI' },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="h-full flex flex-col justify-between bg-gray-950/95 border-r border-gray-800/80 p-4">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            Core Modules
          </div>
          <nav className="flex flex-col gap-1.5">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold'
                      : 'text-gray-400 hover:bg-gray-900/80 hover:text-gray-100 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={clsx('transition-colors', isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300')} />
                      <span>{item.name}</span>
                    </div>
                    <span className={clsx(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded transition-all',
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                        : 'bg-gray-900 text-gray-500 group-hover:text-gray-400'
                    )}>
                      {item.tag}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Quantum Specs Quick Info Widget */}
        <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/20 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Cpu size={14} className="text-quantum-400" />
            <span>Quantum Engine Specs</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
              <span className="text-[10px] text-gray-500 block">Wires</span>
              <span className="font-mono font-bold text-gray-200">6 Qubits</span>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
              <span className="text-[10px] text-gray-500 block">Ansatz</span>
              <span className="font-mono font-bold text-gray-200">2-Layer VQC</span>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
              <span className="text-[10px] text-gray-500 block">Encoding</span>
              <span className="font-mono font-bold text-gray-200">Angle (RY)</span>
            </div>
            <div className="bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
              <span className="text-[10px] text-gray-500 block">Entanglement</span>
              <span className="font-mono font-bold text-gray-200">Ring CNOT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-900 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span className="font-mono">v1.0.0 (SIH)</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Live Sim
          </span>
        </div>
      </div>
    </aside>
  );
};
