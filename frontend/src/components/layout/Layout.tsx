import React,{ useState } from 'react';
import { Outlet,useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ParticleBackground } from '../effects/ParticleBackground';
import { PageTransition } from '../effects/PageTransition';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
        <ParticleBackground />
        <Header />
        <main className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      <ParticleBackground />
      <Header
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex flex-1 relative z-10">
        {/* Desktop Sidebar — sticky, pinned to viewport below header */}
        <div className="hidden lg:block w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
          <Sidebar />
        </div>

        {/* Mobile Slide-over Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 shadow-2xl z-50 border-r border-slate-800">
              <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area — this is the only scrolling region */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
