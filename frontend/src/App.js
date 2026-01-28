/**
 * @file App.js
 * @description Root Application Component.
 * Configures the Provider Hierarchy and Routing Strategy.
 * * CRITICAL ARCHITECTURE:
 * 1. ThemeProvider (Visuals)
 * 2. LanguageProvider (i18n)
 * 3. Router (Navigation Context)
 * 4. AuthProvider (User State - Depends on Router)
 * * @module App
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- CONTEXT PROVIDERS ---
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// --- LAZY LOADED COMPONENTS ---
// Code splitting for optimal initial load performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const MainLayout = lazy(() => import('./layout/MainLayout'));

// --- UI COMPONENTS ---

/**
 * @component PageLoader
 * @description Full-screen loading spinner for Suspense fallback and Auth checks.
 */
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors z-50">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
        {/* Spinner */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-slate-900 dark:text-white font-bold text-lg">Smart Inventory AI</h3>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Initializing System Modules...</p>
      </div>
    </div>
  </div>
);

/**
 * @component ScrollToTop
 * @description Utility to reset scroll position on route navigation.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * @component ProtectedRoute
 * @description Higher-Order Component to gate access based on authentication status.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // 1. Show loader while verifying token
  if (isLoading) {
    return <PageLoader />;
  }

  // 2. Redirect if not authenticated, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. Render protected content
  return children;
};

// --- MAIN APPLICATION ---

const App = () => {
  return (
    // LAYER 1: Visual Theme Context
    <ThemeProvider>
      {/* LAYER 2: Internationalization Context */}
      <LanguageProvider>
        
        {/* LAYER 3: Routing Context (MUST WRAP AUTH) */}
        <Router>
          
          {/* LAYER 4: Authentication Logic (Uses navigate internally) */}
          <AuthProvider>
            
            {/* Utility: Scroll Management */}
            <ScrollToTop />

            {/* Global Notification System */}
            <ToastContainer 
              position="top-right" 
              autoClose={4000} 
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              limit={5}
              className="mt-14 md:mt-0"
            />
            
            {/* Dynamic Route Rendering */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* --- PUBLIC ROUTES --- */}
                <Route path="/login" element={<LoginPage />} />

                {/* --- PROTECTED ROUTES --- */}
                {/* All these routes are wrapped in MainLayout via ProtectedRoute */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard / Index */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Core Modules */}
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="reports" element={<Reports />} />
                  
                  {/* Configuration */}
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Fallback 404 (Redirect to Dashboard) */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </Suspense>

          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;