import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity, BarChart3, FlaskConical, LayoutDashboard, Shield,
  HeartPulse, ShieldAlert, Cpu, Stethoscope
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const diagnosticModules = [
  { name: 'Heart Disease Risk', path: '/analyze?disease=heart', icon: HeartPulse, tag: 'Cardiology' },
  { name: 'Cancer Screening', path: '/analyze?disease=breast_cancer', icon: ShieldAlert, tag: 'Oncology' },
  { name: 'Diabetes Assessment', path: '/analyze?disease=diabetes', icon: Activity, tag: 'Endocrine' },
];

const analyticsModules = [
  { name: 'Clinical AI Dashboard', path: '/dashboard', icon: LayoutDashboard, tag: 'Synthesis' },
  { name: 'Model Benchmarking', path: '/comparison', icon: BarChart3, tag: 'Metrics' },
  { name: 'Biomarker Explainability', path: '/explainability', icon: Shield, tag: 'SHAP' },
  { name: 'Quantum VQC Lab', path: '/quantum-lab', icon: FlaskConical, tag: 'Simulation' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const currentPathWithSearch = location.pathname + location.search;

  const isItemActive = (path: string) => {
    if (path.includes('?')) {
      return currentPathWithSearch === path;
    }
    return location.pathname === path;
  };

  return (
    <aside className="h-full flex flex-col justify-between bg-slate-950 border-r border-slate-800 p-4 select-none">
      <div className="space-y-6">
        {/* Diagnostics Group */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <Stethoscope size={13} className="text-teal-400" />
            <span>Diagnostic Modules</span>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Diagnostic Modules">
            {diagnosticModules.map((item) => {
              const active = isItemActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={clsx(
                    'group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-teal-950/50 text-teal-200 border-l-4 border-teal-500 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border-l-4 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      size={18}
                      className={clsx('transition-colors', active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors',
                      active
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:text-slate-400'
                    )}
                  >
                    {item.tag}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Clinical Analytics Group */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <BarChart3 size={13} className="text-teal-400" />
            <span>Clinical Intelligence</span>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Clinical Intelligence">
            {analyticsModules.map((item) => {
              const active = isItemActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={clsx(
                    'group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-teal-950/50 text-teal-200 border-l-4 border-teal-500 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border-l-4 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon
                      size={18}
                      className={clsx('transition-colors', active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300')}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-2 py-0.5 rounded border transition-colors',
                      active
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800 group-hover:text-slate-400'
                    )}
                  >
                    {item.tag}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quantum Engine Hardware / Specs Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 text-teal-400">
              <Cpu size={15} />
              <span>Simulation Specs</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Ready
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Qubits</span>
              <span className="font-mono font-bold text-slate-200">6 Wires</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Ansatz</span>
              <span className="font-mono font-bold text-slate-200">2-Layer VQC</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Encoding</span>
              <span className="font-mono font-bold text-slate-200">Angle (RY)</span>
            </div>
            <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block">Topology</span>
              <span className="font-mono font-bold text-slate-200">Ring CNOT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px]">SIH #26139 v1.0</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Sim Active
          </span>
        </div>
      </div>
    </aside>
  );
};
