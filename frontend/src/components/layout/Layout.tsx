import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden selection:bg-teal-500/20 selection:text-teal-200">
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar (Fixed Left Navigation) */}
        <div className="hidden lg:flex w-64 flex-shrink-0 h-full flex-col overflow-hidden">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Drawer"
          >
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 border-r border-slate-800 shadow-2xl z-50 h-full">
              <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area (Independent Middle Scroll) */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
