import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart3, FlaskConical, LayoutDashboard, Shield, Cpu, Scale, Award } from 'lucide-react';
import { clsx } from 'clsx';

const primaryNavItems = [
  { name: 'Platform Overview', path: '/about', icon: Award, tag: 'About' },
  { name: 'Disease Risk Analysis', path: '/analyze', icon: Activity, tag: 'Predict' },
  { name: 'Hybrid AI Dashboard', path: '/dashboard', icon: LayoutDashboard, tag: 'Results' },
  { name: 'Quantum Laboratory', path: '/quantum-lab', icon: FlaskConical, tag: 'VQC' },
  { name: 'Model Comparison', path: '/comparison', icon: BarChart3, tag: 'Benchmark' },
  { name: 'Model Explainability', path: '/explainability', icon: Shield, tag: 'SHAP/FI' },
  { name: 'Limitations & Ethics', path: '/limitations', icon: Scale, tag: 'Governance' },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="h-full flex flex-col justify-between bg-black border-r border-white/[0.04] p-5">
      <div className="space-y-8">
        <div>
          <div className="px-3 mb-3 text-[10px] font-semibold tracking-[0.2em] text-white/30 uppercase">
            Core Modules
          </div>
          <nav className="flex flex-col gap-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-[13px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white/[0.06] text-white border border-white/[0.08] shadow-[0_0_20px_rgba(99,102,241,0.08)]'
                      : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon size={17} className={clsx('transition-colors', isActive ? 'text-indigo-400' : 'text-white/25 group-hover:text-white/50')} />
                      <span>{item.name}</span>
                    </div>
                    <span className={clsx(
                      'text-[9px] font-mono px-1.5 py-0.5 rounded-md transition-all tracking-wider',
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                        : 'bg-white/[0.03] text-white/20 group-hover:text-white/30'
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
        <div className="bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-indigo-300/80">
            <Cpu size={13} className="text-indigo-400/60" />
            <span className="tracking-wide">Quantum Engine</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Wires', value: '6 Qubits' },
              { label: 'Ansatz', value: '2-Layer VQC' },
              { label: 'Encoding', value: 'Angle (RY)' },
              { label: 'Entangle', value: 'Ring CNOT' },
            ].map((spec) => (
              <div key={spec.label} className="bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                <span className="text-[9px] text-white/25 block tracking-wider uppercase">{spec.label}</span>
                <span className="font-mono font-semibold text-white/70 text-[11px]">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-white/[0.04] text-[11px] text-white/20">
        <div className="flex items-center justify-between">
          <span className="font-mono">v1.0.0 (SIH)</span>
          <span className="text-emerald-400/60 flex items-center gap-1.5 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/60"></span> Live Sim
          </span>
        </div>
      </div>
    </aside>
  );
};
