import React, { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeCustomizer } from "@/components/ThemeCustomizerProvider";

const SWIPE_TABS = ["/dashboard", "/tests", "/results", "/profile"];

const AppLayout = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { contentWidth, navbarType } = useThemeCustomizer();

  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);
  const minSwipeDistance = 60;
  const maxVerticalDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.innerWidth >= 1024) return;
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (window.innerWidth >= 1024) return;
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    
    // Ignore vertical scrolling
    if (distanceY > maxVerticalDistance) return;
    
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    const currentPath = location.pathname === "/" ? "/dashboard" : location.pathname;
    const currentTabIndex = SWIPE_TABS.findIndex(tab => currentPath === tab || currentPath.startsWith(tab + "/"));
    
    if (currentTabIndex !== -1) {
      if (isLeftSwipe && currentTabIndex < SWIPE_TABS.length - 1) {
        navigate(SWIPE_TABS[currentTabIndex + 1]);
      }
      if (isRightSwipe && currentTabIndex > 0) {
        navigate(SWIPE_TABS[currentTabIndex - 1]);
      }
    }
  };

  const isTestProcess = 
    location.pathname.includes('/mashq/') || 
    location.pathname.includes('/imtixon/');

  const isFullScreenPage = 
    isTestProcess ||
    location.pathname.startsWith('/tests') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/settings') || 
    location.pathname.startsWith('/olympiads') ||
    location.pathname.startsWith('/results') ||
    location.pathname.startsWith('/ai') ||
    location.pathname.startsWith('/essay-checker') ||
    location.pathname.startsWith('/math-solver') ||
    location.pathname.startsWith('/mock-tests') ||
    location.pathname.startsWith('/planner') ||
    location.pathname.startsWith('/qollanmalar');

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] animate-pulse">Auth Sync...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (navigator.onLine && profile && !profile.target_subject && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (navigator.onLine && profile && profile.role === 'teacher' && !profile.phone && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  const isFloating = navbarType === "floating";
  const isResultsPage = location.pathname.startsWith('/results');
  const ptClass = navbarType === "hidden" ? "" : isFloating ? (isResultsPage ? "pt-0 lg:pt-20" : "pt-20") : (isResultsPage ? "pt-0 lg:pt-[56px]" : "pt-[48px] sm:pt-[56px]");

  return (
    <div 
      className="flex min-h-screen flex-col bg-[#F5F5F7] transition-colors duration-300 dark:bg-[#050B10]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isTestProcess && <TopBar />}
      <div className="flex flex-1 w-full relative flex-col">
        <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${ptClass}`}>
          <main className="flex-1 w-full overflow-x-hidden p-0 box-border">
            <div className={`${contentWidth === "boxed" ? "max-w-[1200px] mx-auto" : ""} ${isFullScreenPage ? "h-full" : "p-3 pb-20 sm:p-5 sm:pb-8 lg:p-6 lg:pb-16"}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isTestProcess ? location.pathname.split('/').slice(0, -1).join('/') : location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
