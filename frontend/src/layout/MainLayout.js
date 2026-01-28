/**
 * @file MainLayout.js
 * @description The Core Wrapper for Authenticated Pages.
 * Handles the structural layout (Sidebar + Header + Content Area).
 * * FEATURES:
 * - Dynamic Sidebar Toggle (Persisted in LocalStorage)
 * - Automated Breadcrumb Generation based on Route
 * - Mobile Responsive Overlay
 * - Scroll Restoration on Navigation
 * - Error Boundary Wrapper (Simulated)
 * * @module layout/MainLayout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useTheme } from '../context/ThemeContext';
import { FiChevronRight, FiHome } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---
const STORAGE_KEY_SIDEBAR = 'smartinv_sidebar_state';
const MOBILE_BREAKPOINT = 768; // px

const MainLayout = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // --- STATE ---
  
  // Initialize sidebar state from local storage or default based on screen size
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR);
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth > MOBILE_BREAKPOINT;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);

  // --- EFFECT HOOKS ---

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false); // Auto-close on mobile
      } else {
        // Restore preference on desktop
        const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR);
        if (saved) setIsSidebarOpen(JSON.parse(saved));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist Sidebar State (Desktop only)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY_SIDEBAR, JSON.stringify(isSidebarOpen));
    }
  }, [isSidebarOpen, isMobile]);

  // Scroll to Top on Route Change
  useEffect(() => {
    const mainContent = document.getElementById('main-content-area');
    if (mainContent) mainContent.scrollTop = 0;
  }, [location.pathname]);

  // --- HANDLERS ---

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // --- BREADCRUMB GENERATOR ---
  
  const breadcrumbs = useMemo(() => {
    const pathnames = location.pathname.split('/').filter(x => x);
    return [
      { name: 'Home', path: '/dashboard', icon: FiHome },
      ...pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        // Capitalize first letter
        const name = value.charAt(0).toUpperCase() + value.slice(1);
        return { name, path: to };
      })
    ];
  }, [location.pathname]);

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. NAVIGATION SIDEBAR */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
        
        {/* Header Component */}
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        {/* Breadcrumb Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-sm text-slate-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                {index > 0 && <FiChevronRight size={14} className="text-slate-400" />}
                <button
                  onClick={() => !isLast && navigate(crumb.path)}
                  className={`flex items-center gap-1 transition-colors ${
                    isLast 
                      ? 'font-bold text-slate-800 dark:text-white cursor-default' 
                      : 'hover:text-indigo-600 cursor-pointer'
                  }`}
                  disabled={isLast}
                >
                  {crumb.icon && <crumb.icon size={14} className="mb-0.5" />}
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Scrollable Page Content */}
        <main 
          id="main-content-area"
          className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative p-6 md:p-8"
        >
          {/* Animate Route Transitions */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto min-h-full pb-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Smart Inventory AI Enterprise. Licensed to Admin Corp.
            </p>
          </footer>
        </main>

        {/* Mobile Overlay Backdrop */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
      </div>
    </div>
  );
};

export default MainLayout;