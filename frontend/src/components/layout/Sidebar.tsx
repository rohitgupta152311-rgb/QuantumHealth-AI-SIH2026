import React from 'react';
import { NavLink } from 'react-router-dom';
import {
Activity,
BarChart3,
FlaskConical,
LayoutDashboard,
Shield,
Cpu,
Scale,
Award,
Database,
History,
Settings,
X,
} from 'lucide-react';
import { clsx } from 'clsx';

const primaryNavItems = [
  { name: 'Overview', path: '/about', icon: Award },
  { name: 'Disease Analysis', path: '/analyze', icon: Activity },
  { name: 'AI Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Quantum Lab', path: '/quantum-lab', icon: FlaskConical },
  { name: 'Model Comparison', path: '/comparison', icon: BarChart3 },
  { name: 'Explainability', path: '/explainability', icon: Shield },
];

const operationsNavItems = [
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Training Runs', path: '/training', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Limitations', path: '/limitations', icon: Scale },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const renderNavItem = (item: { name: string; path: string; icon: React.ElementType }) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
          isActive
            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={16}
            className={clsx(
              'flex-shrink-0 transition-colors',
              isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
            )}
            aria-hidden="true"
          />
          <span className="truncate">{item.name}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      aria-label="Main Navigation"
      className="h-full flex flex-col bg-slate-950 border-r border-slate-800/80"
    >
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Mobile Header with Close Button */}
        {onCloseMobile && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 lg:hidden">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Menu</span>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Clinical Decision Support */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase font-mono">
            Clinical
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Clinical Modules">
            {primaryNavItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Operations & Governance */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase font-mono">
            Operations
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Operations and Governance">
            {operationsNavItems.map(renderNavItem)}
          </nav>
        </div>

        {/* Quantum Specs — compact */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-400">
            <Cpu size={13} aria-hidden="true" />
            <span>Quantum Target</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Qubits', value: '6' },
              { label: 'Ansatz', value: '2L VQC' },
              { label: 'Encode', value: 'RY(θ)' },
              { label: 'Entang.', value: 'CNOT' },
            ].map((spec) => (
              <div key={spec.label} className="bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800/60">
                <span className="text-[8px] text-slate-500 block uppercase font-mono leading-none">{spec.label}</span>
                <span className="font-mono font-semibold text-slate-300 text-[11px] leading-tight">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer — always pinned at bottom */}
      <div className="px-3 py-2.5 border-t border-slate-800/80 text-[11px] text-slate-500 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono">v1.0 SIH</span>
          <span className="text-emerald-400 flex items-center gap-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sim
          </span>
        </div>
      </div>
    </aside>
  );
};
