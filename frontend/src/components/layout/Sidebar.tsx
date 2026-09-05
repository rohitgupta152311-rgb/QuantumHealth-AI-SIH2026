import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  BarChart3,
  Database,
  History,
  Settings,
  Activity,
  Cpu,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Disease Analysis', path: '/analyze', icon: Stethoscope },
  { name: 'Model Comparison', path: '/comparison', icon: BarChart3 },
  { name: 'Training History', path: '/training', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();

  const isItemActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="h-full flex flex-col justify-between bg-slate-950 border-r border-slate-800 p-4 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="px-3 mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <Activity size={13} className="text-teal-400" />
            <span>Clinical Workspace</span>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {mainNavItems.map((item) => {
              const active = isItemActive(item.path);
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={clsx(
                    'group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-teal-950/50 text-teal-200 border-l-4 border-teal-500 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 border-l-4 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={clsx(
                        'transition-colors',
                        active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Link to Quantum Laboratory */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="px-3 mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <FlaskConical size={12} className="text-cyan-400" />
            <span>Research Tools</span>
          </div>
          <NavLink
            to="/quantum-lab"
            onClick={onCloseMobile}
            className={clsx(
              'group flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium transition-colors',
              location.pathname === '/quantum-lab'
                ? 'bg-cyan-950/40 text-cyan-200 border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Cpu size={15} className="text-cyan-400" />
              <span>Quantum VQC Lab</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
              6-Qubit
            </span>
          </NavLink>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-slate-300">SIH 2026 #26139</span>
          <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Sim Ready
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Research decision-support prototype.
        </p>
      </div>
    </aside>
  );
};
