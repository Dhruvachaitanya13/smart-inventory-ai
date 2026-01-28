/**
 * @file index.js
 * @description Application Entry Point.
 * Initializes the React DOM root, mounts the application, and sets up global error boundaries.
 * * FEATURES:
 * - Strict Mode Enforcement
 * - Web Vitals Performance Monitoring
 * - Global Error Boundary (Crash Catching)
 * - Environment Configuration Logging
 * * @module index
 * @version 4.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global Tailwind styles
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- CONFIGURATION LOGGING ---
const ENV = process.env.NODE_ENV || 'development';
const VERSION = process.env.REACT_APP_VERSION || '1.0.0';

if (ENV === 'development') {
  console.groupCollapsed(`🚀 Smart Inventory AI Initialized [v${VERSION}]`);
  console.log('Environment:', ENV);
  console.log('React Version:', React.version);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

/**
 * @class ErrorBoundary
 * @description Global Catch-All for React Rendering Errors.
 * Prevents the entire white screen of death by showing a fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service like Sentry
    console.error("🔥 Critical Application Error:", error, errorInfo);
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">System Encountered an Error</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              An unexpected condition has occurred. Our engineering team has been notified.
            </p>
            
            <div className="bg-slate-100 dark:bg-slate-900 rounded p-3 mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-500 font-mono break-all">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
              >
                Reload System
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
          
          <footer className="mt-8 text-xs text-slate-400">
            Smart Inventory AI &bull; Error ID: {Date.now().toString(36)}
          </footer>
        </div>
      );
    }

    return this.props.children; 
  }
}

// --- MOUNTING ---
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* NOTE: AuthProvider removed from here. 
        It is now placed inside App.js, wrapped by Router 
        to fix the "useNavigate" context error.
      */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// --- PERFORMANCE METRICS ---
// Log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint.
reportWebVitals(metric => {
  // Filter out noise, only log slower interactions in dev
  if (ENV === 'development' && metric.value > 200) {
    console.debug(`[Web Vital] ${metric.name}:`, Math.round(metric.value), 'ms');
  }
});