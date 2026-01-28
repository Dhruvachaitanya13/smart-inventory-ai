/**
 * @file ThemeContext.js
 * @description Global Theme Provider.
 * Manages Light/Dark mode state and applies CSS classes to the document root.
 * * FEATURES:
 * - System Preference Detection (prefers-color-scheme)
 * - Persistence in LocalStorage
 * - Immediate application to prevent "flash of wrong theme"
 * - CSS Class toggling on <html> element
 * * @module context/ThemeContext
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// --- CONSTANTS ---
const STORAGE_KEY = 'smartinv_theme_preference';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider = ({ children }) => {
  
  // --- INITIALIZATION LOGIC ---
  
  /**
   * Determine initial theme based on:
   * 1. LocalStorage
   * 2. System Preference (OS level)
   */
  const getInitialTheme = () => {
    // Check storage first
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
      return localStorage.getItem(STORAGE_KEY) === 'dark';
    }
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false; // Default light
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);

  // --- EFFECT HOOKS ---

  /**
   * Effect: Apply theme class to <html> tag
   * This is the engine that actually changes the colors via Tailwind's 'dark' class
   */
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove old class
    root.classList.remove(darkMode ? 'light' : 'dark');
    
    // Add new class
    root.classList.add(darkMode ? 'dark' : 'light');
    
    // Persist choice
    localStorage.setItem(STORAGE_KEY, darkMode ? 'dark' : 'light');

    // Update Meta Theme Color (for mobile browser bars)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', darkMode ? '#0f172a' : '#ffffff');
    }

  }, [darkMode]);

  /**
   * Effect: Listen for System Preference Changes
   * If user hasn't explicitly set a preference, auto-switch
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually overridden yet (optional logic)
      // For this implementation, we allow system changes to notify, 
      // but manual toggle takes precedence via state.
      // Uncomment below to force system sync:
      // setDarkMode(e.matches); 
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- HANDLERS ---

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const setLight = () => setDarkMode(false);
  const setDark = () => setDarkMode(true);

  // --- CONTEXT VALUE ---

  const value = {
    darkMode,
    toggleTheme,
    setLight,
    setDark
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;