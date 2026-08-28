import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-950 shadow-2xl z-50">
              <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
