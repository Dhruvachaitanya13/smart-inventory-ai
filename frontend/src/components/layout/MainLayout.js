import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
// FIX: Pointing to the correct folder
import Header from '../components/layout/Header'; 
import { useTheme } from '../context/ThemeContext';

const MainLayout = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;